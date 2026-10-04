import { db } from "@/db";
import { orders, orderItems, products, shifts, monthlyTargets, users, dailyLedgers } from "@/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProjectionClient from "./ProjectionClient";
import { revalidatePath } from "next/cache";

export default async function ProjectionPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/");
  
  // Verify Super Admin
  const userRecord = await db.query.users.findFirst({
    where: eq(users.email, session.user.email!),
  });
  
  if (userRecord?.role !== "SUPER_ADMIN") {
    return <div className="p-8 text-red-500 font-bold">Unauthorized. Super Admin Only.</div>;
  }

  const resolvedParams = await params;
  const branchId = resolvedParams.id;
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-10"

  // 1. Fetch Target
  const targetRecord = await db.query.monthlyTargets.findFirst({
    where: and(eq(monthlyTargets.restaurantId, branchId), eq(monthlyTargets.monthYear, currentMonth))
  });
  const currentTarget = targetRecord?.salesTarget || 0;

  // 2. Fetch Orders & Calculate COGS
  const allOrders = await db.select().from(orders).where(eq(orders.restaurantId, branchId));
  
  // Calculate revenue split
  let offlineRevenue = 0;
  let grabRevenue = 0;
  let gofoodRevenue = 0;
  let shopeeRevenue = 0;
  
  allOrders.forEach(o => {
    if (o.status === "PAID") {
      if (o.channel === "OFFLINE_POS") offlineRevenue += o.total;
      if (o.channel === "GRAB_FOOD") grabRevenue += o.total;
      if (o.channel === "GO_FOOD") gofoodRevenue += o.total;
      if (o.channel === "SHOPEE_FOOD") shopeeRevenue += o.total;
    }
  });

  const totalRevenue = offlineRevenue + grabRevenue + gofoodRevenue + shopeeRevenue;

  // 3. Fetch True COGS (Cost of Goods Sold) from Daily Ledgers
  const ledgers = await db.select().from(dailyLedgers).where(eq(dailyLedgers.restaurantId, branchId));
  
  let totalCOGS = 0;
  ledgers.forEach(l => {
    if (l.date.startsWith(currentMonth)) {
      totalCOGS += l.marketSpend;
    }
  });

  // 4. Fetch Labor Costs
  const allShifts = await db.select().from(shifts).where(eq(shifts.restaurantId, branchId));
  let totalLaborCost = 0;
  allShifts.forEach(s => {
    totalLaborCost += s.expectedPay;
  });

  // Calculate Metrics
  const grossProfit = totalRevenue - totalCOGS;
  const laborCostRatio = totalRevenue > 0 ? ((totalLaborCost / totalRevenue) * 100).toFixed(1) : "0";

  return (
    <ProjectionClient 
      branchId={branchId}
      currentMonth={currentMonth}
      currentTarget={currentTarget}
      totalRevenue={totalRevenue}
      offlineRevenue={offlineRevenue}
      grabRevenue={grabRevenue}
      gofoodRevenue={gofoodRevenue}
      shopeeRevenue={shopeeRevenue}
      totalCOGS={totalCOGS}
      grossProfit={grossProfit}
      totalLaborCost={totalLaborCost}
      laborCostRatio={laborCostRatio}
      ledgers={ledgers}
    />
  );
}
