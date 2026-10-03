import { auth } from "@/auth";
import { db } from "@/db";
import { shifts, users, restaurants, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { deleteShiftLog, clearAllLogs, deletePosLog } from "./actions";
import { ShieldAlert, Trash2, ArrowLeft, Clock, CalendarDays, TerminalSquare } from "lucide-react";

export default async function AuditLogsPage() {
  const session = await auth();
  // @ts-ignore
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/");

  const allLogs = await db
    .select({
      id: shifts.id,
      date: shifts.date,
      type: shifts.shiftType,
      status: shifts.status,
      clockIn: shifts.clockInTime,
      clockOut: shifts.clockOutTime,
      createdAt: shifts.createdAt,
      userName: users.name,
      branchName: restaurants.name,
    })
    .from(shifts)
    .leftJoin(users, eq(shifts.userId, users.id))
    .leftJoin(restaurants, eq(shifts.restaurantId, restaurants.id))
    .orderBy(desc(shifts.createdAt));

  const allOrders = await db
    .select({
      id: orders.id,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
      userName: users.name,
      branchName: restaurants.name,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-300 pb-20">
      
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              <TerminalSquare className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                System Audit Logs
                <span className="bg-amber-500 text-slate-950 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.5)]">God Mode</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Global Data Ledger</p>
            </div>
          </div>
          <a href="/admin" className="text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700">
            <ArrowLeft className="w-4 h-4" /> Global Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 mt-6 space-y-12">
        
        {/* SHIFTS LEDGER */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Shift & Timeclock Ledger</h2>
              <p className="text-sm text-slate-400 font-medium">Raw database entries for schedules and attendances.</p>
            </div>
            <form action={clearAllLogs}>
              <button type="submit" className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm">
                <ShieldAlert className="w-4 h-4" /> NUKE SHIFT LOGS
              </button>
            </form>
          </div>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-black">
                  <tr>
                    <th className="px-6 py-4">Timestamp ID</th>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4">Staff Member</th>
                    <th className="px-6 py-4">Shift Date & Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Timeclock (In / Out)</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-600 font-bold">
                        The shifts database is empty.
                      </td>
                    </tr>
                  ) : allLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{log.id.split("-")[0]}...</td>
                      <td className="px-6 py-4 font-bold text-white">{log.branchName || "Deleted Branch"}</td>
                      <td className="px-6 py-4 text-slate-300 font-medium">{log.userName || "Unknown"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-indigo-400" />
                          <span className="font-bold text-slate-200">{log.date}</span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{log.type.replace("_", " ")}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                          log.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          log.status === "ABSENT" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-2 text-emerald-400/80">
                            <Clock className="w-3 h-3" /> IN: {log.clockIn ? new Date(log.clockIn).toLocaleTimeString() : "--:--"}
                          </div>
                          <div className="flex items-center gap-2 text-orange-400/80">
                            <Clock className="w-3 h-3" /> OUT: {log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : "--:--"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <form action={deleteShiftLog}>
                          <input type="hidden" name="logId" value={log.id} />
                          <button type="submit" className="p-2 bg-slate-800 hover:bg-red-500 text-slate-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ORDERS LEDGER */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">POS Transaction Ledger</h2>
              <p className="text-sm text-slate-400 font-medium">Raw database entries for POS orders.</p>
            </div>
          </div>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-black">
                  <tr>
                    <th className="px-6 py-4">Timestamp ID</th>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4">Cashier</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-600 font-bold">
                        The orders database is empty. Ring up an order in the POS!
                      </td>
                    </tr>
                  ) : allOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600 flex flex-col gap-1">
                        {order.id.split("-")[0]}...
                        <span className="text-[10px] text-slate-500 font-sans">{new Date(order.createdAt).toLocaleString('id-ID')}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">{order.branchName || "Deleted Branch"}</td>
                      <td className="px-6 py-4 text-slate-300 font-medium">{order.userName || "Unknown"}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">
                        Rp {order.total.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <form action={deletePosLog}>
                          <input type="hidden" name="logId" value={order.id} />
                          <button type="submit" className="p-2 bg-slate-800 hover:bg-red-500 text-slate-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
