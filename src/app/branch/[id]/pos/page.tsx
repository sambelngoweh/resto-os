import { auth } from "@/auth";
import { db } from "@/db";
import { restaurants, products } from "@/db/schema";
import { eq, or, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import PosTerminal from "./PosTerminal";

export default async function PosPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ viewAs?: string }>
}) {
  const { id } = await params;
  const { viewAs } = await searchParams;
  const session = await auth();

  // @ts-ignore
  const userId = session?.user?.id;
  // @ts-ignore
  const realRole = session?.user?.role;
  // @ts-ignore
  const userRestaurantId = session?.user?.restaurantId;

  if (!id || !userId) redirect("/");

  const isActuallySuperAdmin = realRole === "SUPER_ADMIN";
  const effectiveRole = isActuallySuperAdmin && viewAs ? viewAs : realRole;
  const isSuperAdminOrManager = effectiveRole === "SUPER_ADMIN" || effectiveRole === "MANAGER";

  // Firewall: Only Branch Staff/Managers/SuperAdmins can access this POS
  if (!isSuperAdminOrManager && userRestaurantId !== id && !isActuallySuperAdmin) {
    redirect("/");
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const isAuthorizedDevice = cookieStore.get("resto_device_auth")?.value === "true";

  if (effectiveRole === "WORKER" && !isAuthorizedDevice) {
    redirect(`/branch/${id}`);
  }

  const branch = await db.query.restaurants.findFirst({ where: eq(restaurants.id, id) });
  
  // Fetch real menu items (Global HQ items + Branch specific items)
  const menuItems = await db.select().from(products).where(
    or(
      isNull(products.restaurantId),
      eq(products.restaurantId, id)
    )
  );

  return <PosTerminal branchName={branch?.name || "Unknown Branch"} initialProducts={menuItems} />;
}
