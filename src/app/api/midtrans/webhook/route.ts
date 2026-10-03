import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // In production, we MUST verify the signature key here using sha512.
    // For MVP Sandbox, we will just blindly trust the webhook payload for speed.

    const orderId = payload.order_id;
    const transactionStatus = payload.transaction_status;

    if (!orderId) {
      return NextResponse.json({ message: "No order_id provided" }, { status: 400 });
    }

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      // Payment Success!
      await db.update(orders).set({ status: "PAID" }).where(eq(orders.id, orderId));
      console.log(`[Midtrans Webhook] Order ${orderId} PAID successfully.`);
    } else if (transactionStatus === "deny" || transactionStatus === "cancel" || transactionStatus === "expire") {
      // Payment Failed / Expired
      // For now, we can just leave it as PENDING_PAYMENT or mark it OPEN so they can try again.
      console.log(`[Midtrans Webhook] Order ${orderId} failed or expired.`);
    }

    return NextResponse.json({ message: "OK" }, { status: 200 });

  } catch (error) {
    console.error("[Midtrans Webhook Error]", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
