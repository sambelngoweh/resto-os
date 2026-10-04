import { db } from "@/db";
import { dailyLedgers, inventoryItems, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ClosingClient from "./ClosingClient";

export default async function ClosingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/");
  
  const userRecord = await db.query.users.findFirst({
    where: eq(users.email, session.user.email!),
  });
  
  if (userRecord?.role === "WORKER") {
    return <div className="p-8 text-red-500 font-bold">Unauthorized. Manager Access Required.</div>;
  }

  const resolvedParams = await params;
  const branchId = resolvedParams.id;
  
  // Get today's local date string (e.g. "2026-10-04")
  // Since server time might differ, we pass server date but usually Client determines today.
  // For simplicity, we just fetch ALL ledgers for this branch to let the client pick dates.
  const ledgers = await db.select().from(dailyLedgers).where(eq(dailyLedgers.restaurantId, branchId));
  
  // Fetch current inventory items so they can build the snapshot
  const inventory = await db.select().from(inventoryItems).where(eq(inventoryItems.restaurantId, branchId));

  return <ClosingClient branchId={branchId} ledgers={ledgers} inventory={inventory} role={userRecord?.role || "WORKER"} />;
}
