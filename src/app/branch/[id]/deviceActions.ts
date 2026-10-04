"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { branchDevices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";
import { parseClientTelemetry } from "@/lib/deviceAuth";

export async function authorizeDevice(formData: FormData) {
  const branchId = formData.get("branchId") as string;
  const deviceName = (formData.get("deviceName") as string) || "Counter Tablet";
  const deviceType = (formData.get("deviceType") as "ALL_PURPOSE" | "POS_TERMINAL" | "ATTENDANCE_KIOSK") || "ALL_PURPOSE";

  const cookieStore = await cookies();
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") || "";
  const forwardedFor = headerStore.get("x-forwarded-for");
  const rawIp = forwardedFor ? forwardedFor.split(",")[0].trim() : headerStore.get("x-real-ip") || "127.0.0.1";
  
  const telemetry = parseClientTelemetry(userAgent, rawIp);
  const deviceToken = crypto.randomUUID();

  if (branchId) {
    await db.insert(branchDevices).values({
      restaurantId: branchId,
      name: deviceName,
      deviceType,
      deviceModel: telemetry.deviceModel,
      browser: telemetry.browser,
      ipAddress: telemetry.ipAddress,
      deviceToken,
      isAuthorized: true,
      lastActiveAt: new Date(),
    });
  }

  // Set cookies valid for 10 years
  cookieStore.set("resto_device_auth", "true", { 
    maxAge: 60 * 60 * 24 * 365 * 10,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });

  cookieStore.set("resto_device_token", deviceToken, {
    maxAge: 60 * 60 * 24 * 365 * 10,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });

  revalidatePath("/", "layout");
}

export async function deauthorizeDevice() {
  const cookieStore = await cookies();
  const token = cookieStore.get("resto_device_token")?.value;

  if (token) {
    await db.delete(branchDevices).where(eq(branchDevices.deviceToken, token));
  }

  cookieStore.delete("resto_device_auth");
  cookieStore.delete("resto_device_token");
  revalidatePath("/", "layout");
}

export async function revokeDevice(deviceId: string) {
  if (!deviceId) return;
  await db.update(branchDevices).set({ isAuthorized: false }).where(eq(branchDevices.id, deviceId));
  revalidatePath("/", "layout");
}

export async function fetchBranchDevices(branchId: string) {
  if (!branchId) return [];
  return await db.query.branchDevices.findMany({
    where: eq(branchDevices.restaurantId, branchId),
    orderBy: [desc(branchDevices.createdAt)]
  });
}
