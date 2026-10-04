"use server";

import { db } from "@/db";
import { inventoryItems, users } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function verifyManager() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const userRecord = await db.query.users.findFirst({ where: eq(users.email, session.user.email!) });
  if (userRecord?.role === "WORKER") throw new Error("Managers Only");
  return userRecord;
}

export async function addInventoryItem(formData: FormData) {
  await verifyManager();
  
  const restaurantId = formData.get("restaurantId") as string;
  const itemName = formData.get("itemName") as string;
  const category = formData.get("category") as string;
  const unit = formData.get("unit") as string;
  const currentStock = parseInt(formData.get("currentStock") as string);
  const lowStockThreshold = parseInt(formData.get("lowStockThreshold") as string);
  const costPerUnit = parseInt(formData.get("costPerUnit") as string);

  await db.insert(inventoryItems).values({
    restaurantId, itemName, category, unit, currentStock, lowStockThreshold, costPerUnit, lastRestocked: new Date()
  });

  revalidatePath(`/branch/${restaurantId}/inventory`);
}

export async function editInventoryItem(formData: FormData) {
  await verifyManager();
  
  const itemId = formData.get("id") as string;
  const restaurantId = formData.get("restaurantId") as string;
  const itemName = formData.get("itemName") as string;
  const category = formData.get("category") as string;
  const unit = formData.get("unit") as string;
  const currentStock = parseInt(formData.get("currentStock") as string);
  const lowStockThreshold = parseInt(formData.get("lowStockThreshold") as string);
  const costPerUnit = parseInt(formData.get("costPerUnit") as string);

  await db.update(inventoryItems).set({
    itemName, category, unit, currentStock, lowStockThreshold, costPerUnit
  }).where(eq(inventoryItems.id, itemId));

  revalidatePath(`/branch/${restaurantId}/inventory`);
}

export async function adjustStock(itemId: string, restaurantId: string, adjustment: number) {
  await verifyManager();
  
  const item = await db.query.inventoryItems.findFirst({ where: eq(inventoryItems.id, itemId) });
  if (!item) throw new Error("Item not found");

  const newStock = Math.max(0, item.currentStock + adjustment);

  await db.update(inventoryItems)
    .set({ currentStock: newStock, lastRestocked: adjustment > 0 ? new Date() : item.lastRestocked })
    .where(eq(inventoryItems.id, itemId));

  revalidatePath(`/branch/${restaurantId}/inventory`);
}

export async function updateItemDetails(itemId: string, restaurantId: string, updates: any) {
  await verifyManager();
  await db.update(inventoryItems).set(updates).where(eq(inventoryItems.id, itemId));
  revalidatePath(`/branch/${restaurantId}/inventory`);
}

export async function deleteInventoryItem(itemId: string, restaurantId: string) {
  await verifyManager();
  await db.delete(inventoryItems).where(eq(inventoryItems.id, itemId));
  revalidatePath(`/branch/${restaurantId}/inventory`);
}
