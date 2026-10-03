import { auth } from "@/auth";
import { db } from "@/db";
import { shifts, restaurants } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { clockIn, clockOut } from "./actions";
import { Clock, ArrowLeft, CheckCircle2, DollarSign } from "lucide-react";

export default async function TimeclockPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ viewAs?: string }>
}) {
  const { id } = await params;
  const { viewAs } = await searchParams;
  const session = await auth();
  
  const restaurantId = id;
  // @ts-ignore
  const userId = session?.user?.id;
  // @ts-ignore
  const realRole = session?.user?.role;
  // @ts-ignore
  const userRestaurantId = session?.user?.restaurantId;

  if (!restaurantId || !userId) redirect("/");

  const isActuallySuperAdmin = realRole === "SUPER_ADMIN";
  const effectiveRole = isActuallySuperAdmin && viewAs ? viewAs : realRole;
  const isSuperAdminOrManager = effectiveRole === "SUPER_ADMIN" || effectiveRole === "MANAGER";
  
  // Security Barrier
  if (!isSuperAdminOrManager && userRestaurantId !== restaurantId && !isActuallySuperAdmin) {
    redirect("/");
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const isAuthorizedDevice = cookieStore.get("resto_device_auth")?.value === "true";

  if (effectiveRole === "WORKER" && !isAuthorizedDevice) {
    redirect(`/branch/${id}`);
  }

  const branch = await db.query.restaurants.findFirst({ where: eq(restaurants.id, restaurantId) });
  
  // Fetch ALL shifts for this user at this branch
  const myShifts = await db.select().from(shifts).where(
    and(
      eq(shifts.restaurantId, restaurantId),
      eq(shifts.userId, userId)
    )
  ).orderBy(desc(shifts.date));

  // Find today's shift specifically
  const today = new Date().toISOString().split("T")[0];
  const todaysShift = myShifts.find(s => s.date === today);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">


      <main className="max-w-3xl mx-auto p-6 mt-6">
        
        {/* BIG CLOCK IN BUTTON */}
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Today's Shift</h2>
          <p className="text-slate-500 mb-8 text-sm">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          {!todaysShift ? (
            <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 font-bold">You are not scheduled for a shift today.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">{todaysShift.shiftType.replace("_", " ")}</div>
              <div className="font-bold text-slate-700 flex items-center gap-2 mb-8 text-xl">
                Expected Pay: <DollarSign className="w-6 h-6 text-emerald-500" /> {todaysShift.expectedPay / 1000}k
              </div>

              {!todaysShift.clockInTime ? (
                <form action={clockIn} className="w-full">
                  <input type="hidden" name="shiftId" value={todaysShift.id} />
                  <input type="hidden" name="branchId" value={restaurantId} />
                  <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white py-6 rounded-2xl font-black text-2xl transition-all shadow-md active:scale-95 uppercase tracking-widest">
                    Clock In
                  </button>
                </form>
              ) : !todaysShift.clockOutTime ? (
                <form action={clockOut} className="w-full">
                  <input type="hidden" name="shiftId" value={todaysShift.id} />
                  <input type="hidden" name="branchId" value={restaurantId} />
                  <div className="text-sky-600 font-bold mb-4 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Clocked In at {new Date(todaysShift.clockInTime).toLocaleTimeString()}
                  </div>
                  <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-2xl font-black text-2xl transition-all shadow-md active:scale-95 uppercase tracking-widest">
                    Clock Out
                  </button>
                </form>
              ) : (
                <div className="w-full bg-slate-50 border border-slate-200 py-6 rounded-2xl font-bold text-slate-500 flex flex-col items-center gap-2">
                  <span className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-6 h-6" /> Shift Completed</span>
                  <span className="text-xs font-medium mt-2 text-slate-400">
                    In: {new Date(todaysShift.clockInTime).toLocaleTimeString()} • Out: {new Date(todaysShift.clockOutTime).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MY SCHEDULE */}
        <h3 className="text-lg font-extrabold text-slate-900 mb-4 ml-2">My Upcoming Shifts</h3>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {myShifts.filter(s => s.date !== today).length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-bold">No other shifts scheduled.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myShifts.filter(s => s.date !== today).map(s => (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-bold text-slate-900">{s.date}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.shiftType.replace("_", " ")}</div>
                  </div>
                  <div className="font-bold text-slate-700 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> {s.expectedPay / 1000}k
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
