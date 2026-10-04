"use server";
import { db } from "@/db";
import { productRecipes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addRecipeIngredient(productId: string, inventoryItemId: string, quantity: number, branchId: string) {
  // Check if this ingredient is already mapped for this product (for this branch's inventory item)
  const existing = await db.query.productRecipes.findFirst({
    where: and(
      eq(productRecipes.productId, productId),
      eq(productRecipes.inventoryItemId, inventoryItemId)
    )
  });

  if (existing) {
    await db.update(productRecipes)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(productRecipes.id, existing.id));
  } else {
    await db.insert(productRecipes).values({
      productId,
      inventoryItemId,
      quantity
    });
  }
  revalidatePath(`/branch/${branchId}/recipes`);
}

export async function removeRecipeIngredient(recipeId: string, branchId: string) {
  await db.delete(productRecipes).where(eq(productRecipes.id, recipeId));
  revalidatePath(`/branch/${branchId}/recipes`);
}
