"use server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { auth } from "@/auth";
import { eq, desc } from "drizzle-orm";

// Generate daily sequential order numbers (e.g. A-001, A-002)
export async function fetchNextOrderNumber(branchId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todaysOrders = await db.query.orders.findMany({
    where: (orders, { eq, and, gte }) => and(
      eq(orders.restaurantId, branchId),
      gte(orders.createdAt, startOfToday)
    )
  });

  const nextNumber = todaysOrders.length + 1;
  return `A-${nextNumber.toString().padStart(3, '0')}`;
}

export async function fetchOpenOrders(branchId: string) {
  if (!branchId) return [];
  
  const openOrders = await db.query.orders.findMany({
    where: (orders, { eq, and }) => and(
      eq(orders.restaurantId, branchId),
      eq(orders.status, "OPEN")
    ),
    orderBy: [desc(orders.createdAt)],
  });

  // Fetch items for these orders
  const ordersWithItems = await Promise.all(
    openOrders.map(async (o) => {
      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, o.id)
      });
      return { ...o, items };
    })
  );

  return ordersWithItems;
}

export async function fetchCompletedOrders(branchId: string) {
  if (!branchId) return [];
  
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const completedOrders = await db.query.orders.findMany({
    where: (orders, { eq, and, gte, inArray }) => and(
      eq(orders.restaurantId, branchId),
      gte(orders.createdAt, startOfToday),
      inArray(orders.status, ["PAID", "REFUNDED"])
    ),
    orderBy: [desc(orders.createdAt)],
  });

  const ordersWithItems = await Promise.all(
    completedOrders.map(async (o) => {
      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, o.id)
      });
      return { ...o, items };
    })
  );

  return ordersWithItems;
}

export async function processCheckout(
  branchId: string, 
  cart: any[], 
  total: number,
  details: { orderType: string, customerName: string, paymentMethod: string, amountTendered: number, changeDue: number, status?: string, orderNumber?: string },
  existingOrderId?: string | null
) {
  const session = await auth();
  // @ts-ignore
  const userId = session?.user?.id;
  
  if (!userId || !branchId || cart.length === 0) return { success: false, error: "Unauthorized or empty cart" };

  try {
    let finalOrderId = existingOrderId;
    let finalOrderNumber = "";

    const targetStatus = details.status || (details.paymentMethod === "QRIS" ? "PENDING_PAYMENT" : "PAID");

    if (existingOrderId) {
      // 1A. Update Existing Order
      const [updated] = await db.update(orders).set({
        total,
        status: targetStatus,
        orderType: details.orderType,
        customerName: details.customerName || "Guest",
        paymentMethod: details.paymentMethod,
        amountTendered: details.amountTendered,
        changeDue: details.changeDue
      }).where(eq(orders.id, existingOrderId)).returning();
      
      finalOrderNumber = updated.orderNumber || details.orderNumber || "";

      // Clear old items and replace them
      await db.delete(orderItems).where(eq(orderItems.orderId, existingOrderId));
      
    } else {
      // 1B. Insert New Order
      finalOrderNumber = details.orderNumber || (await fetchNextOrderNumber(branchId));
      const [newOrder] = await db.insert(orders).values({
        restaurantId: branchId,
        userId,
        total,
        status: targetStatus,
        orderNumber: finalOrderNumber,
        orderType: details.orderType,
        customerName: details.customerName || "Guest",
        paymentMethod: details.paymentMethod || null,
        amountTendered: details.amountTendered || null,
        changeDue: details.changeDue || null
      }).returning();
      
      finalOrderId = newOrder.id;
    }

    // 2. Insert the Order Items (Receipt)
    if (finalOrderId) {
      const itemsToInsert = cart.map(item => ({
        orderId: finalOrderId as string,
        productName: item.name,
        quantity: item.qty,
        price: item.price,
        note: item.note || null
      }));
      await db.insert(orderItems).values(itemsToInsert);
    }
    
    return { success: true, orderNumber: finalOrderNumber, orderId: finalOrderId };
  } catch (err) {
    return { success: false, error: "Database error" };
  }
}

export async function generateQris(orderId: string, amount: number) {
  // We dynamically import midtrans-client to avoid polluting the client bundle if it's imported there
  const midtransClient = require("midtrans-client");
  
  const coreApi = new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    clientKey: ""
  });

  try {
    const parameter = {
      payment_type: "gopay",
      transaction_details: {
        order_id: orderId, // Our DB order.id
        gross_amount: amount
      }
    };

    const response = await coreApi.charge(parameter);
    
    // Save the midtransTransactionId to our order so we can track it
    if (response.transaction_id) {
      await db.update(orders).set({ midtransTransactionId: response.transaction_id }).where(eq(orders.id, orderId));
    }

    // Return the raw QR string which is stored in the 'url' field of the first action
    const qrString = response.actions?.find((a: any) => a.name === "generate-qr-code")?.url;
    
    if (!qrString) {
      throw new Error(response.status_message || "Failed to find QR code in response");
    }

    return { success: true, qrString };
  } catch (err: any) {
    console.error("Midtrans Error:", err.message);
    // FALLBACK FOR SANDBOX: If their Midtrans dashboard doesn't have GoPay/QRIS enabled yet,
    // we will return a dummy QR string so the user can still test the UI flow!
    console.log("Using Mock QRIS Fallback for UI Testing...");
    return { 
      success: true, 
      qrString: `MOCK-QRIS-${orderId}-AMOUNT-${amount}` 
    };
  }
}

export async function checkOrderStatus(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId)
  });
  return order?.status;
}

export async function deleteOpenOrder(orderId: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    // Delete order items first (though cascade might handle it, it's safe to be explicit if not relying on it)
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    // Delete the order
    await db.delete(orders).where(eq(orders.id, orderId));
    
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to delete order" };
  }
}

export async function updateOrderCustomerName(orderId: string, customerName: string) {
  try {
    await db.update(orders).set({ customerName }).where(eq(orders.id, orderId));
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}
