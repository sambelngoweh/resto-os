"use server";
import { db } from "@/db";
import { shifts, orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteShiftLog(formData: FormData) {
  const logId = formData.get("logId") as string;
  if (logId) {
    await db.delete(shifts).where(eq(shifts.id, logId));
    revalidatePath("/admin/logs");
  }
}

export async function clearAllLogs() {
  await db.delete(shifts); // Deletes every row in the shifts table
  revalidatePath("/admin/logs");
}

export async function deletePosLog(formData: FormData) {
  const logId = formData.get("logId") as string;
  if (logId) {
    // Delete items first if needed, then the order
    await db.delete(orderItems).where(eq(orderItems.orderId, logId));
    await db.delete(orders).where(eq(orders.id, logId));
    revalidatePath("/admin/logs");
  }
}
