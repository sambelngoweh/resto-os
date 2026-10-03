import { auth } from "@/auth";
import { db } from "@/db";
import { shifts, users, restaurants } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { updateShiftStatus } from "./actions";
import { Users, ArrowLeft, CheckCircle2, XCircle, DollarSign, UserCircle, Phone, CreditCard } from "lucide-react";
import StaffActions from "./StaffActions";

export default async function TeamPage({ 
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
  const realRole = session?.user?.role;
  // @ts-ignore
  const userRestaurantId = session?.user?.restaurantId;

  const isActuallySuperAdmin = realRole === "SUPER_ADMIN";
  const effectiveRole = isActuallySuperAdmin && viewAs ? viewAs : realRole;
  
  const isSuperAdminOrManager = effectiveRole === "SUPER_ADMIN" || effectiveRole === "MANAGER";
  
  if (!restaurantId || (!isSuperAdminOrManager && userRestaurantId !== restaurantId && !isActuallySuperAdmin)) {
    redirect("/");
  }

  const branch = await db.query.restaurants.findFirst({ where: eq(restaurants.id, restaurantId) });
  const branchStaff = await db.select().from(users).where(eq(users.restaurantId, restaurantId));
  const branchShifts = await db.select().from(shifts).where(eq(shifts.restaurantId, restaurantId)).orderBy(desc(shifts.date));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20">
      


      <main className="max-w-7xl mx-auto p-6 mt-6">
        
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Staff Roster & Pay</h2>
            <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm">Mark shifts as completed to process automated payroll, or log absences.</p>
          </div>
          
          <form action={async (formData) => {
            "use server";
            const { addStaffMember } = await import("./actions");
            await addStaffMember(formData);
          }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex gap-3 shadow-sm items-center">
            <input type="hidden" name="branchId" value={id} />
            <input type="text" name="name" required placeholder="Staff Name" className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-indigo-500 font-bold" />
            <button type="submit" className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 whitespace-nowrap">
              + Add Worker
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          {branchStaff.map(worker => {
            const workerShifts = branchShifts.filter(s => s.userId === worker.id);
            const completedShifts = workerShifts.filter(s => s.status === "COMPLETED");
            const totalPay = completedShifts.reduce((sum, s) => sum + s.expectedPay, 0);

            return (
              <div key={worker.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row items-center gap-6 overflow-hidden">
                
                {/* Worker Identity (Left) */}
                <div className="flex items-center gap-4 w-full xl:w-72 shrink-0">
                  {worker.image ? (
                    <img src={worker.image} className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                      <UserCircle className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight">{worker.name}</h3>
                    
                    {worker.email && !worker.email.includes("@unbound.local") ? (
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate">{worker.email}</div>
                    ) : (
                      <form action={async (formData) => {
                        "use server";
                        const { bindStaffEmail } = await import("./actions");
                        await bindStaffEmail(formData);
                      }} className="flex items-center gap-2 mt-1">
                        <input type="hidden" name="userId" value={worker.id} />
                        <input type="hidden" name="branchId" value={id} />
                        <input type="email" name="email" required placeholder="Bind Google Email" className="px-2 py-1 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded text-[10px] outline-none focus:border-orange-500 font-bold w-32 dark:text-orange-200" />
                        <button type="submit" className="bg-orange-600 text-white font-bold px-2 py-1 rounded text-[10px] hover:bg-orange-700 transition-colors">Bind</button>
                      </form>
                    )}
                    
                    {(worker.phone || worker.bankAccount) && (
                      <div className="mt-2 space-y-1">
                        {worker.phone && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {worker.phone}
                          </div>
                        )}
                        {worker.bankAccount && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate" title={worker.bankAccount}>
                            <CreditCard className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {worker.bankAccount}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Shifts Horizontal List (Middle) */}
                <div className="flex-1 flex overflow-x-auto gap-3 items-center w-full custom-scrollbar pb-2 xl:pb-0 xl:border-l xl:border-r border-slate-100 dark:border-slate-800 xl:px-6">
                  {workerShifts.length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-500 font-bold italic w-full text-center">No shifts scheduled</p> : null}
                  {workerShifts.map(s => (
                    <div key={s.id} className={`flex items-center gap-3 p-2 px-3 rounded-xl border whitespace-nowrap transition-colors shrink-0 ${s.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200' : s.status === 'ABSENT' ? 'bg-red-50 border-red-200' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.date}</div>
                        <div className={`text-xs font-bold ${s.status === 'ABSENT' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                          Rp {s.expectedPay / 1000}k
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 border-l pl-2 ml-1 border-black/5">
                        <form action={updateShiftStatus}>
                          <input type="hidden" name="shiftId" value={s.id} />
                          <input type="hidden" name="branchId" value={id} />
                          <input type="hidden" name="status" value={s.status === "COMPLETED" ? "SCHEDULED" : "COMPLETED"} />
                          <button type="submit" className={`p-1.5 rounded-lg transition-all ${s.status === 'COMPLETED' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 text-slate-400 dark:text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'}`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </form>
                        <form action={updateShiftStatus}>
                          <input type="hidden" name="shiftId" value={s.id} />
                          <input type="hidden" name="branchId" value={id} />
                          <input type="hidden" name="status" value={s.status === "ABSENT" ? "SCHEDULED" : "ABSENT"} />
                          <button type="submit" className={`p-1.5 rounded-lg transition-all ${s.status === 'ABSENT' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-200 text-slate-400 dark:text-slate-500 hover:bg-red-100 hover:text-red-600'}`}>
                            <XCircle className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Pay & Actions (Right) */}
                <div className="w-full xl:w-48 shrink-0 flex items-center justify-between xl:justify-end gap-3">
                  <div className="bg-emerald-50 px-4 py-2 rounded-xl text-emerald-700 font-black flex items-center justify-center gap-1 border border-emerald-200 shadow-inner flex-1 xl:flex-none">
                    <DollarSign className="w-4 h-4" /> {(totalPay / 1000).toLocaleString()}k <span className="text-[10px] font-bold text-emerald-600 ml-1 uppercase">Earned</span>
                  </div>
                  <StaffActions userId={worker.id} branchId={id} currentName={worker.name || ""} />
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  );
}
