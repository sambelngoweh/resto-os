import { db } from "@/db";
import { inventoryItems, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/");
  
  const userRecord = await db.query.users.findFirst({
    where: eq(users.email, session.user.email!),
  });
  
  // Managers and Super Admins only
  if (userRecord?.role === "WORKER") {
    return <div className="p-8 text-red-500 font-bold">Unauthorized. Manager Access Required.</div>;
  }

  // Next.js 15 async params fix
  const resolvedParams = await params;
  const branchId = resolvedParams.id;
  
  const items = await db.select().from(inventoryItems).where(eq(inventoryItems.restaurantId, branchId));

  return <InventoryClient branchId={branchId} initialItems={items} role={userRecord?.role || "WORKER"} />;
}
