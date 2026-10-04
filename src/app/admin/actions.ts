"use server"

import { db } from "@/db";
import { restaurants, users, branchDevices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Security Check: Only Super Admins can run these actions
async function checkSuperAdmin() {
  const session = await auth();
  // @ts-ignore
  if (!session || session.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function createRestaurant(formData: FormData) {
  await checkSuperAdmin();
  
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  
  if (!name) return;

  await db.insert(restaurants).values({ name, address });
  
  // Refresh the page data
  revalidatePath("/admin");
}

export async function updateUser(userId: string, formData: FormData) {
  await checkSuperAdmin();
  
  const role = formData.get("role") as "WORKER" | "MANAGER" | "SUPER_ADMIN";
  const staffType = formData.get("staffType") as "REGULAR" | "SHIFT_TIMER" | null;
  let restaurantId = formData.get("restaurantId") as string | null;
  
  if (restaurantId === "none") restaurantId = null;

  const updateData: any = { role, restaurantId };
  if (staffType) updateData.staffType = staffType;

  await db.update(users)
    .set(updateData)
    .where(eq(users.id, userId));
    
  // Refresh the page data
  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

export async function editRestaurant(formData: FormData) {
  await checkSuperAdmin();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  
  if (!id || !name) return;
  await db.update(restaurants).set({ name, address }).where(eq(restaurants.id, id));
  revalidatePath("/admin");
}

export async function terminateDeviceAdmin(deviceId: string) {
  await checkSuperAdmin();
  if (!deviceId) return;
  await db.update(branchDevices).set({ isAuthorized: false }).where(eq(branchDevices.id, deviceId));
  revalidatePath("/admin");
}

export async function reactivateDeviceAdmin(deviceId: string) {
  await checkSuperAdmin();
  if (!deviceId) return;
  await db.update(branchDevices).set({ isAuthorized: true }).where(eq(branchDevices.id, deviceId));
  revalidatePath("/admin");
}

export async function deleteDeviceAdmin(deviceId: string) {
  await checkSuperAdmin();
  if (!deviceId) return;
  await db.delete(branchDevices).where(eq(branchDevices.id, deviceId));
  revalidatePath("/admin");
}

export async function enrollDeviceAdmin(formData: FormData) {
  await checkSuperAdmin();
  const restaurantId = formData.get("restaurantId") as string;
  const name = formData.get("name") as string;
  const deviceType = (formData.get("deviceType") as "ALL_PURPOSE" | "POS_TERMINAL" | "ATTENDANCE_KIOSK") || "ALL_PURPOSE";
  const authorizeCurrentDevice = formData.get("authorizeCurrentDevice") === "true";

  if (!restaurantId || !name) return;

  const crypto = await import("crypto");
  const deviceToken = crypto.randomUUID();

  const { headers, cookies } = await import("next/headers");
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") || "";
  const forwardedFor = headerStore.get("x-forwarded-for");
  const rawIp = forwardedFor ? forwardedFor.split(",")[0].trim() : headerStore.get("x-real-ip") || "127.0.0.1";
  
  const { parseClientTelemetry } = await import("@/lib/deviceAuth");
  const telemetry = parseClientTelemetry(userAgent, rawIp);

  await db.insert(branchDevices).values({
    restaurantId,
    name,
    deviceType,
    deviceModel: authorizeCurrentDevice ? telemetry.deviceModel : null,
    ipAddress: authorizeCurrentDevice ? telemetry.ipAddress : null,
    browser: authorizeCurrentDevice ? telemetry.browser : null,
    deviceToken,
    isAuthorized: true,
    lastActiveAt: new Date(),
  });

  if (authorizeCurrentDevice) {
    const cookieStore = await cookies();
    cookieStore.set("resto_device_auth", "true", {
      maxAge: 60 * 60 * 24 * 365 * 10,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    cookieStore.set("resto_device_token", deviceToken, {
      maxAge: 60 * 60 * 24 * 365 * 10,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  revalidatePath("/admin");
}

export async function bindCurrentDeviceToTerminal(deviceId: string) {
  await checkSuperAdmin();
  if (!deviceId) return;

  const device = await db.query.branchDevices.findFirst({
    where: eq(branchDevices.id, deviceId),
  });
  if (!device) return;

  const { headers, cookies } = await import("next/headers");
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") || "";
  const forwardedFor = headerStore.get("x-forwarded-for");
  const rawIp = forwardedFor ? forwardedFor.split(",")[0].trim() : headerStore.get("x-real-ip") || "127.0.0.1";

  const { parseClientTelemetry } = await import("@/lib/deviceAuth");
  const telemetry = parseClientTelemetry(userAgent, rawIp);

  await db.update(branchDevices)
    .set({
      deviceModel: telemetry.deviceModel,
      ipAddress: telemetry.ipAddress,
      browser: telemetry.browser,
      lastActiveAt: new Date(),
      isAuthorized: true,
    })
    .where(eq(branchDevices.id, deviceId));

  const cookieStore = await cookies();
  cookieStore.set("resto_device_auth", "true", {
    maxAge: 60 * 60 * 24 * 365 * 10,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  cookieStore.set("resto_device_token", device.deviceToken, {
    maxAge: 60 * 60 * 24 * 365 * 10,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  revalidatePath("/admin");
}

export async function updateDeviceDetails(deviceId: string, formData: FormData) {
  await checkSuperAdmin();
  const name = formData.get("name") as string;
  const deviceType = formData.get("deviceType") as "ALL_PURPOSE" | "POS_TERMINAL" | "ATTENDANCE_KIOSK";
  const restaurantId = formData.get("restaurantId") as string;

  if (!deviceId) return;

  await db.update(branchDevices)
    .set({
      ...(name ? { name } : {}),
      ...(deviceType ? { deviceType } : {}),
      ...(restaurantId ? { restaurantId } : {}),
    })
    .where(eq(branchDevices.id, deviceId));

  revalidatePath("/admin");
}

