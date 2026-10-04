"use server";

import { db } from "@/db";
import { monthlyTargets, users } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function setMonthlyTarget(restaurantId: string, monthYear: string, targetValue: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.email, session.user.email!),
  });

  if (userRecord?.role !== "SUPER_ADMIN") {
    throw new Error("Super Admin Only");
  }

  // Upsert target
  const existing = await db.query.monthlyTargets.findFirst({
    where: and(eq(monthlyTargets.restaurantId, restaurantId), eq(monthlyTargets.monthYear, monthYear))
  });

  if (existing) {
    await db.update(monthlyTargets)
      .set({ salesTarget: targetValue })
      .where(eq(monthlyTargets.id, existing.id));
  } else {
    await db.insert(monthlyTargets).values({
      restaurantId,
      monthYear,
      salesTarget: targetValue
    });
  }

  revalidatePath(`/branch/${restaurantId}/projection`);
}
