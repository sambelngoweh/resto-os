import { db } from "@/db";
import { products, inventoryItems, productRecipes, users } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import RecipeClient from "./RecipeClient";

export default async function RecipesPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.email, session.user.email!),
  });
  if (userRecord?.role === "WORKER") {
    redirect("/"); // Workers can't build recipes
  }

  const resolvedParams = await params;
  const branchId = resolvedParams.id;

  // 1. Fetch Global Menu (products where restaurantId is null)
  const globalProducts = await db.select().from(products).where(isNull(products.restaurantId));

  // 2. Fetch Branch Inventory Items
  const branchInventory = await db.select().from(inventoryItems).where(eq(inventoryItems.restaurantId, branchId));

  // 3. Fetch all current Recipes that link to this branch's inventory
  // We join productRecipes with inventoryItems to only get recipes for THIS branch
  const recipesData = await db.select({
    id: productRecipes.id,
    productId: productRecipes.productId,
    inventoryItemId: productRecipes.inventoryItemId,
    quantity: productRecipes.quantity,
    itemName: inventoryItems.itemName,
    category: inventoryItems.category
  })
  .from(productRecipes)
  .innerJoin(inventoryItems, eq(productRecipes.inventoryItemId, inventoryItems.id))
  .where(eq(inventoryItems.restaurantId, branchId));

  return (
    <RecipeClient 
      branchId={branchId}
      products={globalProducts}
      inventory={branchInventory}
      recipes={recipesData}
    />
  );
}
