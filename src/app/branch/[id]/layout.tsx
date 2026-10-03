import { auth } from "@/auth";
import { db } from "@/db";
import { restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import BranchSidebar from "./BranchSidebar";

export default async function BranchLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/");
  
  // @ts-ignore
  const realRole = session?.user?.role as string;
  // @ts-ignore
  const userRestaurantId = session?.user?.restaurantId as string;

  const branch = await db.query.restaurants.findFirst({ where: eq(restaurants.id, id) });
  if (!branch) redirect("/");

  const cookieStore = await cookies();
  const isAuthorizedDevice = cookieStore.get("resto_device_auth")?.value === "true";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <BranchSidebar 
        realRole={realRole} 
        userRestaurantId={userRestaurantId} 
        branchName={branch.name} 
        isAuthorizedDevice={isAuthorizedDevice}
      />
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
