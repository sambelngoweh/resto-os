import { auth } from "@/auth";
import { db } from "@/db";
import { shifts, users, restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import SchedulerClientTabs from "./SchedulerClientTabs";

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
    <div className="min-h-screen bg-slate-50 font-sans pb-20 dark:bg-slate-950">
      
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href={`/branch/${restaurantId}`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 dark:text-white text-lg uppercase tracking-tight">Shift Scheduler</h1>
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">{branch?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <SchedulerClientTabs 
        restaurantId={restaurantId} 
        isSuperAdmin={isSuperAdmin} 
        shiftsByDate={shiftsByDate} 
        staffMap={staffMap} 
      />
    </div>
  );
}
