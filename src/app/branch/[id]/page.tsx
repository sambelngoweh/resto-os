import { auth } from "@/auth";
import { db } from "@/db";
import { restaurants, shifts, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { HandMetal, Laptop, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { cookies } from "next/headers";
import { authorizeDevice, deauthorizeDevice } from "./deviceActions";
import { fetchBranchQrLogs } from "@/app/actions/qrSessionActions";

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

  const { validateDeviceAuth } = await import("@/lib/deviceAuth");
  const { isAuthorized: isAuthorizedDevice } = await validateDeviceAuth();
  const qrLogs = await fetchBranchQrLogs(id);

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

          <div className={`p-6 rounded-3xl border text-left ${isAuthorizedDevice ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-orange-50/70 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${isAuthorizedDevice ? 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400' : 'bg-orange-200 dark:bg-orange-900/60 text-orange-700 dark:text-orange-400'}`}>
                <Laptop className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className={`font-black text-lg ${isAuthorizedDevice ? 'text-emerald-900 dark:text-emerald-300' : 'text-orange-900 dark:text-orange-300'}`}>
                  {isAuthorizedDevice ? 'This Device is an Authorized Branch Terminal' : 'Unauthorized Personal Device'}
                </h3>
                <p className={`text-xs mt-1 mb-4 ${isAuthorizedDevice ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'}`}>
                  {isAuthorizedDevice 
                    ? "Staff can clock in/out and operate the POS from this device using Fast QR Code scanning." 
                    : "Staff logging in from personal phones/laptops are restricted from accessing POS and Timeclock to prevent remote fraud."}
                </p>
                
                {isAuthorizedDevice ? (
                  <form action={deauthorizeDevice}>
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                      <ShieldAlert className="w-4 h-4 text-red-500" /> Remove This Device
                    </button>
                  </form>
                ) : (
                  <form action={authorizeDevice} className="flex flex-col sm:flex-row gap-2">
                    <input type="hidden" name="branchId" value={id} />
                    <input 
                      type="text" 
                      name="deviceName" 
                      placeholder="e.g. Counter Tablet 1" 
                      defaultValue="Counter Tablet 1"
                      className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
                    />
                    <select
                      name="deviceType"
                      defaultValue="POS_TERMINAL"
                      className="px-2 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                    >
                      <option value="POS_TERMINAL">🛒 POS</option>
                      <option value="ATTENDANCE_KIOSK">⏰ Att POS</option>
                      <option value="ALL_PURPOSE">⚙️ All-in-One</option>
                    </select>
                    <button type="submit" className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 whitespace-nowrap">
                      <ShieldCheck className="w-4 h-4" /> Authorize This Terminal
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Super Admin QR Activity & Attendance Log */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-left">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Live QR Attendance & Session Log
                </h3>
                <p className="text-slate-400 text-xs">Real-time audit trail of staff clock-ins and cashier terminal switches</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                {qrLogs.length} events
              </span>
            </div>

            {qrLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-bold border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No QR attendance or terminal events recorded yet today.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {qrLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${log.action === 'POS_LOGIN' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white mr-1.5">{log.userName || "Staff"}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">({log.userRole || "WORKER"})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        {log.action === 'ATTENDANCE' && (log.attendanceType === 'CLOCK_OUT' ? 'Clocked Out' : 'Clocked In')}
                        {log.action === 'POS_LOGIN' && 'Cashier Login'}
                        {log.action === 'SWITCH_CASHIER' && 'Switched Cashier'}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">{log.clockTime || new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
