"use server";
import { db } from "@/db";
import { shifts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function clockIn(formData: FormData) {
  const shiftId = formData.get("shiftId") as string;
  const branchId = formData.get("branchId") as string;
  
  if (!shiftId) return;

  const now = new Date().toISOString();
  await db.update(shifts).set({ clockInTime: now }).where(eq(shifts.id, shiftId));
  
  revalidatePath(`/branch/${branchId}/timeclock`);
}

export async function clockOut(formData: FormData) {
  const shiftId = formData.get("shiftId") as string;
  const branchId = formData.get("branchId") as string;
  
  if (!shiftId) return;

  const now = new Date().toISOString();
  await db.update(shifts).set({ clockOutTime: now }).where(eq(shifts.id, shiftId));
  
  revalidatePath(`/branch/${branchId}/timeclock`);
}
