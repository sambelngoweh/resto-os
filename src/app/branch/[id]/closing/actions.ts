"use server";

import { db } from "@/db";
import { dailyLedgers, dailyStockSnapshots, inventoryItems, orders, users, orderItems, products, productRecipes } from "@/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function verifyManager() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const userRecord = await db.query.users.findFirst({ where: eq(users.email, session.user.email!) });
  if (userRecord?.role === "WORKER") throw new Error("Managers Only");
  return userRecord;
}

export async function getOrCreateLedger(restaurantId: string, dateStr: string) {
  await verifyManager();
  
  // Calculate total sales for this exact date from POS
  const startOfDay = new Date(dateStr + "T00:00:00");
  const endOfDay = new Date(dateStr + "T23:59:59.999");

  const todaysOrders = await db.select().from(orders).where(
    and(
      eq(orders.restaurantId, restaurantId),
      gte(orders.createdAt, startOfDay),
      lt(orders.createdAt, endOfDay),
      eq(orders.status, "PAID")
    )
  );
  
  const totalSales = todaysOrders.reduce((sum, order) => sum + order.total, 0);

  // Auto-Deplete Inventory using Recipe Engine
  // Find all order items sold today
  const todaysOrderIds = todaysOrders.map(o => o.id);
  
  let autoSoldIngredients: Record<string, number> = {};
  
  if (todaysOrderIds.length > 0) {
    const soldItems = await db.select({
      productId: products.id,
      quantity: orderItems.quantity
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productName, products.name)) // Map order_item back to product by name
    .where(sql`${orderItems.orderId} IN ${todaysOrderIds}`);

    const soldProductIds = soldItems.map(item => item.productId);
    
    if (soldProductIds.length > 0) {
      // Find recipes for these products
      const recipes = await db.select().from(productRecipes).where(sql`${productRecipes.productId} IN ${soldProductIds}`);
      
      // Calculate how much inventory was used
      soldItems.forEach(sold => {
        const productRecipe = recipes.filter(r => r.productId === sold.productId);
        productRecipe.forEach(recipe => {
          const totalUsed = recipe.quantity * sold.quantity;
          if (!autoSoldIngredients[recipe.inventoryItemId]) autoSoldIngredients[recipe.inventoryItemId] = 0;
          autoSoldIngredients[recipe.inventoryItemId] += totalUsed;
        });
      });
    }
  }

  let ledger = await db.query.dailyLedgers.findFirst({
    where: and(eq(dailyLedgers.restaurantId, restaurantId), eq(dailyLedgers.date, dateStr))
  });

  if (!ledger) {
    await db.insert(dailyLedgers).values({
      restaurantId,
      date: dateStr,
      totalSales,
      marketSpend: 0,
      status: "OPEN"
    });
    ledger = await db.query.dailyLedgers.findFirst({
      where: and(eq(dailyLedgers.restaurantId, restaurantId), eq(dailyLedgers.date, dateStr))
    });
  } else if (ledger.status === "OPEN") {
    // Keep syncing latest sales as long as register is open
    await db.update(dailyLedgers).set({ totalSales }).where(eq(dailyLedgers.id, ledger.id));
    if (ledger) ledger.totalSales = totalSales;
  }

  // Always fetch saved snapshots if they exist (so unlocked ledgers remember their data)
  let savedSnapshots = [];
  if (ledger) {
    savedSnapshots = await db.select({
      itemId: dailyStockSnapshots.itemId,
      itemName: inventoryItems.itemName,
      category: inventoryItems.category,
      openingStock: dailyStockSnapshots.openingStock,
      purchased: dailyStockSnapshots.purchased,
      sold: dailyStockSnapshots.sold,
      waste: dailyStockSnapshots.waste,
      closingStock: dailyStockSnapshots.closingStock
    }).from(dailyStockSnapshots)
      .innerJoin(inventoryItems, eq(dailyStockSnapshots.itemId, inventoryItems.id))
      .where(eq(dailyStockSnapshots.ledgerId, ledger.id));
  }

  return { ledger, savedSnapshots, autoSoldIngredients };
}

export async function unlockRegister(ledgerId: string, restaurantId: string) {
  const user = await verifyManager();
  if (user.role !== "SUPER_ADMIN") throw new Error("Only Super Admins can unlock ledgers");
  
  // 1. Fetch the snapshots so we can rollback the physical inventory
  const snaps = await db.select().from(dailyStockSnapshots).where(eq(dailyStockSnapshots.ledgerId, ledgerId));
  
  // 2. Rollback the physical inventory to the Opening Stock (so it doesn't double-deduct when they re-close)
  for (const snap of snaps) {
    await db.update(inventoryItems)
      .set({ currentStock: snap.openingStock })
      .where(eq(inventoryItems.id, snap.itemId));
  }

  // 3. Mark ledger back to OPEN (Notice we DO NOT delete the snapshots anymore!)
  await db.update(dailyLedgers).set({ status: "OPEN", closedAt: null }).where(eq(dailyLedgers.id, ledgerId));
  
  revalidatePath(`/branch/${restaurantId}/closing`);
}

export async function updateMarketSpend(ledgerId: string, restaurantId: string, amount: number) {
  await verifyManager();
  await db.update(dailyLedgers).set({ marketSpend: amount }).where(eq(dailyLedgers.id, ledgerId));
  revalidatePath(`/branch/${restaurantId}/closing`);
}

export async function closeRegister(ledgerId: string, restaurantId: string, snapshots: any[]) {
  await verifyManager();
  
  // 1. Mark Ledger as CLOSED
  await db.update(dailyLedgers).set({ 
    status: "CLOSED", 
    closedAt: new Date() 
  }).where(eq(dailyLedgers.id, ledgerId));

  // 2. Clear any previous snapshots for this ledger (in case they unlocked and re-closed)
  await db.delete(dailyStockSnapshots).where(eq(dailyStockSnapshots.ledgerId, ledgerId));

  // 3. Save Snapshots & Update Main Inventory
  for (const snap of snapshots) {
    await db.insert(dailyStockSnapshots).values({
      ledgerId,
      itemId: snap.itemId,
      openingStock: snap.openingStock,
      purchased: snap.purchased,
      sold: snap.sold,
      waste: snap.waste,
      closingStock: snap.closingStock
    });

    // Automatically carry over to main inventory
    await db.update(inventoryItems)
      .set({ currentStock: snap.closingStock })
      .where(eq(inventoryItems.id, snap.itemId));
  }

  revalidatePath(`/branch/${restaurantId}/closing`);
}
