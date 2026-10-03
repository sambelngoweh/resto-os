import { auth } from "@/auth";
import { db } from "@/db";
import { restaurants, users } from "@/db/schema";
import { redirect } from "next/navigation";
import { createRestaurant, updateUser } from "./actions";
import { Building2, Users, ArrowLeft, ShieldCheck, UserCircle, Settings2, Plus, MapPin, ShieldAlert, BookOpen, TerminalSquare, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BranchCard } from "./BranchCard";

export default async function AdminDashboard() {
  const session = await auth();
  
  // Security barrier
  // @ts-ignore
  if (!session || session.user?.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const allRestaurants = await db.select().from(restaurants);
  const allUsers = await db.select().from(users);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors">
      
      {/* Top Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-sm">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">HQ Dashboard</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">Global Control Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <ThemeToggle />
            
            <a href="/admin/logs" className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors border border-slate-800 dark:border-slate-700">
              System Audit Logs
            </a>
            
            <div className="hidden md:flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800">
              {session.user?.image ? (
                <img src={session.user.image} alt="Admin" className="w-8 h-8 rounded-full shadow-sm" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">A</div>
              )}
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{session.user?.name}</span>
            </div>
            <a href="/" className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Exit HQ
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 mt-6">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* 1. RESTAURANTS (BRANCHES) - Left Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" /> Branches
                </h2>
                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold transition-colors">{allRestaurants.length} active</span>
              </div>
              
              <form action={createRestaurant} className="flex flex-col gap-3 mb-8 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Create New Branch</p>
                <input name="name" placeholder="Branch Name (e.g. Seattle HQ)" required className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:text-white transition-all placeholder:text-slate-400" />
                <input name="address" placeholder="Location Address" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:text-white transition-all placeholder:text-slate-400" />
                <button type="submit" className="mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 text-sm font-semibold transition-all flex justify-center items-center gap-2 shadow-md">
                  <Plus className="w-4 h-4" /> Add Branch
                </button>
              </form>

              {allRestaurants.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 transition-colors">
                  <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No branches created yet.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {allRestaurants.map(r => (
                    <BranchCard key={r.id} branch={r} />
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 2. MENU MANAGER & STAFF - Right Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Global Menu Manager Banner */}
            <a href="/admin/menu" className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer border border-indigo-500 overflow-hidden relative">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 dark:bg-slate-900/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 dark:bg-slate-900/20 p-2.5 rounded-xl">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-extrabold text-xl group-hover:underline">Global Menu Manager</h3>
                </div>
                <p className="text-indigo-100 text-sm font-medium pl-14">Create and push standard menu items to all branches simultaneously.</p>
              </div>
              <div className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold whitespace-nowrap shadow-sm group-hover:scale-105 transition-transform z-10 text-center relative">
                Open Manager →
              </div>
            </a>

            {/* Global Staff */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" /> Global Staff
                </h2>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-bold">{allUsers.length} total members</span>
              </div>
              
              <div className="flex flex-col gap-3">
                {allUsers.map(u => {
                  const assignedBranch = allRestaurants.find(r => r.id === u.restaurantId);
                  
                  return (
                    <div key={u.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col xl:flex-row xl:items-center gap-4 overflow-hidden">
                      
                      {/* Left: Avatar & Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {u.image ? (
                          <img src={u.image} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                            <UserCircle className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-slate-900 dark:text-white truncate">{u.name}</p>
                            {u.role === 'SUPER_ADMIN' && <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                          </div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate pr-4">{u.email}</p>
                        </div>
                      </div>
                      
                      {/* Middle: Current Branch Badge */}
                      <div className="shrink-0 xl:w-40 flex items-center">
                        {assignedBranch ? (
                          <div className="bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-inner w-full max-w-[160px]">
                             <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                             <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{assignedBranch.name}</span>
                          </div>
                        ) : (
                          <div className="bg-orange-50 dark:bg-orange-950/30 px-3 py-2 rounded-xl border border-orange-200 dark:border-orange-900/50 flex items-center gap-2 w-full max-w-[160px]">
                             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0"></div>
                             <span className="text-xs font-bold text-orange-700 dark:text-orange-400 truncate">Floating</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Right: Controls */}
                      <form action={updateUser.bind(null, u.id)} className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                        <select name="role" defaultValue={u.role} className="flex-1 sm:flex-none border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-xs h-10 w-full sm:w-28">
                          <option value="WORKER">Worker</option>
                          <option value="MANAGER">Manager</option>
                          <option value="SUPER_ADMIN">Admin</option>
                        </select>
                        
                        <select name="restaurantId" defaultValue={u.restaurantId || "none"} className="flex-1 sm:flex-none border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate text-xs h-10 w-full sm:w-36">
                          <option value="none">-- Unassign --</option>
                          {allRestaurants.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                        
                        <button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors font-bold shadow-sm h-10 text-xs shrink-0 w-full sm:w-auto">Save</button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
