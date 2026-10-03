"use server"

import { db } from "@/db";
import { restaurants, users } from "@/db/schema";
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
  let restaurantId = formData.get("restaurantId") as string | null;
  
  if (restaurantId === "none") restaurantId = null;

  await db.update(users)
    .set({ role, restaurantId })
    .where(eq(users.id, userId));
    
  // Refresh the page data
  revalidatePath("/admin");
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
