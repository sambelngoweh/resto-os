"use server";
import { db } from "@/db";
import { shifts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateShiftStatus(formData: FormData) {
  const shiftId = formData.get("shiftId") as string;
  const status = formData.get("status") as "COMPLETED" | "ABSENT" | "SCHEDULED";
  const branchId = formData.get("branchId") as string;

  if (!shiftId || !status || !branchId) return;

  await db.update(shifts).set({ status }).where(eq(shifts.id, shiftId));
  revalidatePath(`/branch/${branchId}/team`);
}

export async function addStaffMember(formData: FormData) {
  const branchId = formData.get("branchId") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string | null;
  const staffType = (formData.get("staffType") as string) === "SHIFT_TIMER" ? "SHIFT_TIMER" : "REGULAR";

  if (!branchId || !name) return;

  const { users } = await import("@/db/schema");
  
  await db.insert(users).values({
    name,
    email: email || `pending-${crypto.randomUUID()}@unbound.local`,
    role: "WORKER",
    staffType,
    restaurantId: branchId,
  });

  revalidatePath(`/branch/${branchId}/team`);
  revalidatePath("/", "layout");
}

export async function toggleStaffType(formData: FormData) {
  const userId = formData.get("userId") as string;
  const branchId = formData.get("branchId") as string;
  const nextType = formData.get("nextType") as "REGULAR" | "SHIFT_TIMER";
  if (!userId) return;

  const { users } = await import("@/db/schema");
  await db.update(users).set({ staffType: nextType }).where(eq(users.id, userId));
  
  if (branchId) revalidatePath(`/branch/${branchId}/team`);
  revalidatePath("/", "layout");
}

export async function bindStaffEmail(formData: FormData) {
  const userId = formData.get("userId") as string;
  const email = formData.get("email") as string;
  const branchId = formData.get("branchId") as string;

  if (!userId || !email) return;

  const { users } = await import("@/db/schema");
  
  await db.update(users).set({ email }).where(eq(users.id, userId));
  revalidatePath(`/branch/${branchId}/team`);
}

export async function deleteStaffMember(formData: FormData) {
  const userId = formData.get("userId") as string;
  const branchId = formData.get("branchId") as string;
  if (!userId || !branchId) return;
  const { users } = await import("@/db/schema");
  await db.delete(users).where(eq(users.id, userId));
  revalidatePath(`/branch/${branchId}/team`);
}

export async function editStaffMember(formData: FormData) {
  const userId = formData.get("userId") as string;
  const branchId = formData.get("branchId") as string;
  const name = formData.get("name") as string;
  if (!userId || !branchId || !name) return;
  const { users } = await import("@/db/schema");
  await db.update(users).set({ name }).where(eq(users.id, userId));
  revalidatePath(`/branch/${branchId}/team`);
}
