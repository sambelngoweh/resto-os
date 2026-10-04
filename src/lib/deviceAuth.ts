import { cookies, headers } from "next/headers";
import { db } from "@/db";
import { branchDevices } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface DeviceAuthResult {
  isAuthorized: boolean;
  device: typeof branchDevices.$inferSelect | null;
  reason?: "NO_COOKIE" | "DEVICE_NOT_FOUND" | "DEVICE_REVOKED" | "OK";
}

/**
 * Parses User-Agent header into human-readable hardware device model and browser.
 */
export function parseClientTelemetry(userAgent: string, ip: string) {
  let deviceModel = "Unknown Terminal";
  let browser = "Web Browser";

  // 1. Device / Hardware Model Detection
  if (/iPad/i.test(userAgent)) {
    deviceModel = "Apple iPad";
  } else if (/iPhone/i.test(userAgent)) {
    deviceModel = "Apple iPhone";
  } else if (/Macintosh/i.test(userAgent)) {
    deviceModel = "Apple Mac";
  } else if (/Windows/i.test(userAgent)) {
    deviceModel = "Windows PC / Counter PC";
  } else if (/CrOS/i.test(userAgent)) {
    deviceModel = "Chromebook";
  } else if (/Android/i.test(userAgent)) {
    // Try to extract Android model name: e.g. "Linux; Android 13; SM-X200 Build..."
    const match = userAgent.match(/Android[^;]+;\s*([^;)]+)/i);
    if (match && match[1]) {
      const rawModel = match[1].trim().replace(/Build\/.*/i, "").trim();
      // Friendly aliases for common tablets
      if (/SM-X/i.test(rawModel) || /SM-T/i.test(rawModel)) {
        deviceModel = `Samsung Galaxy Tab (${rawModel})`;
      } else {
        deviceModel = `Android Device (${rawModel})`;
      }
    } else {
      deviceModel = "Android Tablet / POS Terminal";
    }
  } else if (/Linux/i.test(userAgent)) {
    deviceModel = "Linux Terminal";
  }

  // 2. Browser Detection
  if (/Edg\//i.test(userAgent)) {
    const match = userAgent.match(/Edg\/([\d.]+)/);
    browser = `Edge ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/Chrome\//i.test(userAgent)) {
    const match = userAgent.match(/Chrome\/([\d.]+)/);
    browser = `Chrome ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/Version\/([\d.]+).*Safari/i.test(userAgent)) {
    const match = userAgent.match(/Version\/([\d.]+)/);
    browser = `Safari ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/Firefox\//i.test(userAgent)) {
    const match = userAgent.match(/Firefox\/([\d.]+)/);
    browser = `Firefox ${match ? match[1].split('.')[0] : ''}`.trim();
  }

  // Clean local IP display
  let cleanIp = ip;
  if (!cleanIp || cleanIp === "::1" || cleanIp === "127.0.0.1") {
    cleanIp = "127.0.0.1 (Localhost)";
  }

  return { deviceModel, browser, ipAddress: cleanIp };
}

/**
 * Validates whether current client/browser is an authorized terminal.
 * Checks both cookie and database state so remote terminations take effect immediately.
 * Also updates `lastActiveAt`, `ipAddress`, `deviceModel`, and `browser` for live telemetry!
 */
export async function validateDeviceAuth(): Promise<DeviceAuthResult> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("resto_device_auth")?.value === "true";
    const token = cookieStore.get("resto_device_token")?.value;

    if (!authCookie || !token) {
      return { isAuthorized: false, device: null, reason: "NO_COOKIE" };
    }

    const device = await db.query.branchDevices.findFirst({
      where: eq(branchDevices.deviceToken, token),
    });

    if (!device) {
      return { isAuthorized: false, device: null, reason: "DEVICE_NOT_FOUND" };
    }

    if (!device.isAuthorized) {
      return { isAuthorized: false, device, reason: "DEVICE_REVOKED" };
    }

    // Remote tracking: capture live IP and hardware model on each verification
    try {
      const headerStore = await headers();
      const userAgent = headerStore.get("user-agent") || "";
      const forwardedFor = headerStore.get("x-forwarded-for");
      const rawIp = forwardedFor ? forwardedFor.split(",")[0].trim() : headerStore.get("x-real-ip") || "127.0.0.1";
      const telemetry = parseClientTelemetry(userAgent, rawIp);

      await db.update(branchDevices)
        .set({ 
          lastActiveAt: new Date(),
          deviceModel: telemetry.deviceModel,
          browser: telemetry.browser,
          ipAddress: telemetry.ipAddress
        })
        .where(eq(branchDevices.id, device.id));
    } catch {
      // non-blocking telemetry failure
    }

    return { isAuthorized: true, device, reason: "OK" };
  } catch (error) {
    console.error("Error validating device auth:", error);
    return { isAuthorized: false, device: null };
  }
}
