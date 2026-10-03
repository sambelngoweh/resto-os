import { auth } from "@/auth";
import { db } from "@/db";
import { shifts, users, restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { generateGachaSchedule } from "./actions";
import { CalendarDays, Dices, ArrowLeft, Clock, DollarSign } from "lucide-react";

export default async function SchedulerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  
  const restaurantId = id;
  // @ts-ignore
  const role = session?.user?.role;
  // @ts-ignore
  const userRestaurantId = session?.user?.restaurantId;
  
  const isSuperAdmin = role === "SUPER_ADMIN" || role === "MANAGER";
  
  if (!restaurantId || (!isSuperAdmin && userRestaurantId !== restaurantId)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-500 mb-6">You are not authorized to view this branch's scheduler.</p>
          <a href="/admin" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold">Go Back</a>
        </div>
      </div>
    );
  }

  const branch = await db.query.restaurants.findFirst({ where: eq(restaurants.id, restaurantId) });
  const branchShifts = await db.select().from(shifts).where(eq(shifts.restaurantId, restaurantId));
  const branchStaff = await db.select().from(users).where(eq(users.restaurantId, restaurantId));
  
  const staffMap = branchStaff.reduce((acc, u) => {
    acc[u.id] = u;
    return acc;
  }, {} as Record<string, any>);

  // Group shifts by date for the UI Grid
  const shiftsByDate = branchShifts.reduce((acc, shift) => {
    if (!acc[shift.date]) acc[shift.date] = [];
    acc[shift.date].push(shift);
    return acc;
  }, {} as Record<string, typeof branchShifts>);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* Top Navbar */}


      <main className="max-w-7xl mx-auto p-6 mt-6">
        
        {/* Roll Gacha Header Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border-4 border-indigo-100">
            <Dices className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Roll the Gacha Engine</h2>
          <p className="text-slate-500 max-w-lg mb-8 leading-relaxed">
            Automatically generate randomized shifts for the 10am-8pm staggered rush matrix. The engine guarantees exactly 2 days off per worker and locks in payroll logic.
          </p>
          
          <form action={generateGachaSchedule} className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-200 w-full max-w-xl">
            <input type="hidden" name="branchId" value={restaurantId} />
            <input type="date" name="startDate" required className="flex-1 p-4 rounded-2xl border-0 shadow-sm text-slate-700 font-bold outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500" />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-md flex justify-center items-center gap-3 active:scale-[0.98]">
              <Dices className="w-5 h-5" /> Generate 7-Day Matrix
            </button>
          </form>
        </div>

        {/* Display The Matrix */}
        <div className="space-y-6">
          {Object.keys(shiftsByDate).sort().map(date => (
            <div key={date} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <h3 className="text-xl font-bold text-slate-900 mb-5 border-b pb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-500" />
                {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {shiftsByDate[date].map(s => {
                  const worker = s.userId ? staffMap[s.userId] : null;
                  
                  // Color coding based on shift type
                  const isMidnight = s.shiftType === "MIDNIGHT";
                  const isPart = s.shiftType.includes("PART");
                  
                  return (
                    <div key={s.id} className={`p-4 rounded-2xl border flex flex-col justify-between h-full ${worker ? (isMidnight ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200') : 'bg-red-50 border-red-200 border-dashed'}`}>
                      <div>
                        <div className={`text-[10px] font-extrabold uppercase tracking-widest mb-3 ${isMidnight ? 'text-slate-400' : 'text-slate-500'}`}>
                          {s.shiftType.replace("_", " ")}
                        </div>
                        
                        {worker ? (
                          <div className={`font-bold flex items-center gap-2 text-sm ${isMidnight ? 'text-white' : 'text-slate-900'}`}>
                            {worker.image ? (
                              <img src={worker.image} className="w-7 h-7 rounded-full object-cover border border-white/20" />
                            ) : (
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${isMidnight ? 'bg-slate-800 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                                {worker.name?.[0]}
                              </div>
                            )}
                            {worker.name}
                          </div>
                        ) : (
                          <div className="font-bold text-red-600 flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            OPEN SHIFT
                          </div>
                        )}
                      </div>
                      
                      <div className={`mt-5 pt-4 border-t flex items-center justify-between text-xs font-bold ${isMidnight ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {isPart ? "5 hrs" : "8 hrs"}
                        </span>
                        <span className={`flex items-center gap-0.5 px-2.5 py-1 rounded-lg ${isMidnight ? 'bg-slate-800 text-green-400' : 'bg-green-50 text-green-700'}`}>
                          <DollarSign className="w-3.5 h-3.5" /> {s.expectedPay / 1000}k
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
