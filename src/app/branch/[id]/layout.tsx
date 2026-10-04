import { auth } from "@/auth";
import { db } from "@/db";
import { restaurants, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import BranchSidebar from "./BranchSidebar";

export default async function BranchLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  
  // @ts-ignore
  const realRole = session?.user?.role as string;
  // @ts-ignore
  const userRestaurantId = session?.user?.restaurantId as string;

  // Profile Completion Gate: Staff must have phone & bankAccount registered
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id)
  });

  const isProfileComplete = Boolean(dbUser?.phone && dbUser?.bankAccount);
  const isSuperAdmin = realRole === "SUPER_ADMIN";

  if (!isProfileComplete && !isSuperAdmin) {
    redirect("/profile?gate=REQUIRED");
  }

  const branch = await db.query.restaurants.findFirst({ where: eq(restaurants.id, id) });
  if (!branch) redirect("/");

  const { validateDeviceAuth } = await import("@/lib/deviceAuth");
  const { isAuthorized: isAuthorizedDevice } = await validateDeviceAuth();

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
