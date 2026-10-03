import { auth } from "@/auth";
import { db } from "@/db";
import { restaurants, shifts, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { HandMetal, Laptop, ShieldCheck, ShieldAlert } from "lucide-react";
import { cookies } from "next/headers";
import { authorizeDevice, deauthorizeDevice } from "./deviceActions";

export default async function BranchPortal({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ viewAs?: string }>
}) {
  const { id } = await params;
  const { viewAs } = await searchParams;
  
  if (!id) {
    return <div className="p-10 text-center text-red-500 font-bold">CRITICAL ROUTER ERROR: Branch ID is missing from URL.</div>;
  }

  const session = await auth();
  
  // @ts-ignore
  const userRestaurantId = session?.user?.restaurantId;
  // @ts-ignore
  const realRole = session?.user?.role;

  // The Super Admin can impersonate other roles
  const isActuallySuperAdmin = realRole === "SUPER_ADMIN";
  const effectiveRole = isActuallySuperAdmin && viewAs ? viewAs : realRole;

  // SECURITY
  if (effectiveRole !== "SUPER_ADMIN" && userRestaurantId !== id && !isActuallySuperAdmin) {
    return <div className="p-10 text-center text-red-500 font-bold">Access Denied: You are not assigned to branch {id}. Your branch is {userRestaurantId}</div>;
  }

  const branch = await db.query.restaurants.findFirst({ where: eq(restaurants.id, id) });
  if (!branch) {
    return <div className="p-10 text-center text-red-500 font-bold">Error: Branch ID {id} not found in database!</div>;
  }

  // Dashboard stats
  const branchStaff = await db.select().from(users).where(eq(users.restaurantId, id));
  
  const today = new Date().toISOString().split("T")[0];
  const todaysShifts = await db.select().from(shifts).where(
    and(
      eq(shifts.restaurantId, id),
      eq(shifts.date, today)
    )
  );
  const clockedIn = todaysShifts.filter(s => s.clockInTime && !s.clockOutTime).length;

  const cookieStore = await cookies();
  const isAuthorizedDevice = cookieStore.get("resto_device_auth")?.value === "true";

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
        <HandMetal className="w-10 h-10 text-indigo-500" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Welcome to {branch.name}</h1>
      <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 max-w-md mb-8">
        You are currently viewing the operations portal as a <span className="font-bold text-slate-700 dark:text-slate-300">{effectiveRole}</span>.
        Select an application from the sidebar to get started.
      </p>
      
      {effectiveRole !== "WORKER" && (
        <div className="flex flex-col gap-4 w-full max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{branchStaff.length}</div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Staff</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-3xl font-black text-emerald-600 mb-1">{clockedIn}</div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Clocked In Now</div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border text-left flex items-start gap-4 ${isAuthorizedDevice ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
            <div className={`p-3 rounded-full ${isAuthorizedDevice ? 'bg-emerald-200 text-emerald-700' : 'bg-orange-200 text-orange-700'}`}>
              <Laptop className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className={`font-black text-lg ${isAuthorizedDevice ? 'text-emerald-900' : 'text-orange-900'}`}>
                {isAuthorizedDevice ? 'Authorized Cashier Device' : 'Unauthorized Device'}
              </h3>
              <p className={`text-sm mt-1 mb-4 ${isAuthorizedDevice ? 'text-emerald-700' : 'text-orange-700'}`}>
                {isAuthorizedDevice 
                  ? "This device is securely locked. Staff members can use this exact device to access the POS and Timeclock." 
                  : "Staff members logging in from this device will be BLOCKED from accessing the POS and Timeclock to prevent remote fraud."}
              </p>
              
              {isAuthorizedDevice ? (
                <form action={deauthorizeDevice}>
                  <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg hover:bg-slate-50 dark:bg-slate-950 transition-all">
                    <ShieldAlert className="w-4 h-4" /> Remove Authorization
                  </button>
                </form>
              ) : (
                <form action={authorizeDevice}>
                  <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20">
                    <ShieldCheck className="w-4 h-4" /> Authorize this Tablet/PC
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
