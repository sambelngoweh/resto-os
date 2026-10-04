import { auth, signIn, signOut } from "@/auth";
import { Store, ShieldCheck, LogOut, ArrowRight, ChefHat, UserCircle, Clock, QrCode, Sparkles, Building2, Laptop, CalendarCheck, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import HomeTerminalActions from "./HomeTerminalActions";
import { db } from "@/db";
import { restaurants, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  // @ts-ignore
  const userRestaurantId = session?.user?.restaurantId as string | undefined;
  // @ts-ignore
  const userRole = (session?.user?.role as string) || "WORKER";

  let branchName = "Main Branch";
  if (userRestaurantId) {
    const branch = await db.query.restaurants.findFirst({
      where: eq(restaurants.id, userRestaurantId),
    });
    if (branch) branchName = branch.name;
  }

  // Profile Completion Gate Check
  let isProfileComplete = true;
  if (session?.user?.id) {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });
    isProfileComplete = Boolean(dbUser?.phone && dbUser?.bankAccount);
  }

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between p-6 sm:p-8 font-sans transition-colors">
      
      {/* Top Header */}
      <header className="w-full flex justify-between items-center max-w-6xl mx-auto shrink-0 pb-4">
        <div className="flex items-center gap-3 text-slate-900 dark:text-white">
          <div className="bg-slate-900 dark:bg-white p-2.5 rounded-2xl text-white dark:text-slate-900 shadow-md">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight block leading-none">Resto OS</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              Operations & POS Suite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-2.5 bg-white dark:bg-slate-800/80 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* Main Command Center Content */}
      <main className="flex-1 flex items-center justify-center max-w-6xl w-full mx-auto my-auto">
        {!session ? (
          /* ================= GUEST / LOGGED-OUT VIEW ================= */
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl p-8 sm:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl">
            {/* Left Branding */}
            <div className="md:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Restaurant Platform</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                Smart POS, Shifts & Live Inventory.
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-md">
                Fast QR attendance for kitchen staff, real-time recipe depletion, thermal receipt printing, and enterprise branch control.
              </p>
              
              <div className="flex items-center gap-6 pt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-500" />
                  <span>Authorized Devices Only</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>Instant QR Attendance</span>
                </div>
              </div>
            </div>

            {/* Right Authentication / Kiosk Box */}
            <div className="md:col-span-6 bg-slate-50/80 dark:bg-slate-800/80 p-8 rounded-3xl border border-slate-200 dark:border-slate-700/60 flex flex-col items-center text-center shadow-inner">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 shadow-sm">
                <Store className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Sign In to Resto OS</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 mb-6">
                Managers and Staff: Log in with Google or use the quick kiosk below.
              </p>

              <form action={async () => { "use server"; await signIn("google"); }} className="w-full mb-2">
                <button className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl transition-all font-extrabold flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]">
                  <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </form>

              <HomeTerminalActions isUserLoggedIn={false} />
            </div>
          </div>
        ) : (
          /* ================= LOGGED-IN COMMAND CENTER (2-COLUMN FULLSCREEN) ================= */
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Column (4 cols) - User Identity & Quick Settings */}
            <div className="md:col-span-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between items-center text-center">
              <div className="w-full flex flex-col items-center">
                {/* Profile Image with Super Admin Badge */}
                <div className="relative mb-4">
                  {session.user?.image ? (
                    <img src={session.user.image} alt="Profile" className="w-24 h-24 rounded-full shadow-lg border-4 border-white dark:border-slate-800 object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 text-3xl font-black">
                      {session.user?.name?.[0]}
                    </div>
                  )}
                  {userRole === "SUPER_ADMIN" && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2 rounded-full shadow-md border-2 border-white dark:border-slate-800" title="Super Admin">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{session.user?.name}</h2>
                <div className="flex items-center gap-2 mt-1 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                    {userRole.replace("_", " ")}
                  </span>
                  {userRestaurantId && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full whitespace-nowrap">
                      {branchName}
                    </span>
                  )}
                </div>

                <div className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span>Email Account</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{session.user?.email}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                    <span>Assigned Branch</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{branchName}</span>
                  </div>
                </div>
              </div>

              {/* Profile Settings & Sign Out Buttons */}
              <div className="w-full space-y-2 pt-6">
                <Link
                  href="/profile"
                  className="w-full bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold py-3 px-4 rounded-xl transition-all flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-indigo-500" />
                    <span>My Profile & Bank Info</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </Link>

                <form action={async () => { "use server"; await signOut(); }} className="w-full">
                  <button className="w-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 py-2.5 px-4 rounded-xl transition-all font-bold flex items-center justify-center gap-2 text-xs">
                    <LogOut className="w-3.5 h-3.5" />
                    Secure Sign Out
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column (8 cols) - Operations & Kiosk Command Center */}
            <div className="md:col-span-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between">
              
              {/* Operations Portal Buttons */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Operational Portals
                  </h3>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
                    {userRole === "SUPER_ADMIN" ? "Full Access HQ" : "Branch Operations"}
                  </span>
                </div>

                <div className={`grid gap-4 ${userRole === "SUPER_ADMIN" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                  {userRole === "SUPER_ADMIN" && (
                    <Link
                      href="/admin"
                      className="group bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-600 dark:hover:bg-blue-600 p-5 rounded-3xl border border-blue-200 dark:border-blue-900/60 transition-all text-left flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-blue-200 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 group-hover:bg-white group-hover:text-blue-600 flex items-center justify-center transition-colors shrink-0">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-lg text-blue-950 dark:text-blue-200 group-hover:text-white transition-colors truncate">HQ Dashboard</h4>
                          <p className="text-xs text-blue-700/80 dark:text-blue-400 group-hover:text-white/80 transition-colors mt-0.5 truncate">
                            Multi-branch revenue, staff payroll & global inventory
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-blue-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                    </Link>
                  )}

                  {userRestaurantId && (
                    <Link
                      href={!isProfileComplete && userRole !== "SUPER_ADMIN" ? "/profile?gate=REQUIRED" : `/branch/${userRestaurantId}`}
                      className={`group p-5 rounded-3xl border transition-all text-left flex items-center justify-between shadow-sm ${
                        !isProfileComplete && userRole !== "SUPER_ADMIN"
                          ? "bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-600 dark:hover:bg-amber-600 border-amber-200 dark:border-amber-900/60"
                          : "bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-600 dark:hover:bg-emerald-600 border-emerald-200 dark:border-emerald-900/60"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                          !isProfileComplete && userRole !== "SUPER_ADMIN"
                            ? "bg-amber-200 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 group-hover:bg-white group-hover:text-amber-600"
                            : "bg-emerald-200 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 group-hover:bg-white group-hover:text-emerald-600"
                        }`}>
                          {!isProfileComplete && userRole !== "SUPER_ADMIN" ? (
                            <AlertCircle className="w-6 h-6" />
                          ) : (
                            <Store className="w-6 h-6" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white group-hover:text-white transition-colors whitespace-nowrap">
                              {branchName}
                            </h4>
                            {!isProfileComplete && userRole !== "SUPER_ADMIN" && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 group-hover:bg-white group-hover:text-amber-800 whitespace-nowrap shadow-sm">
                                Profile Required
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-white/80 transition-colors mt-0.5 truncate">
                            {!isProfileComplete && userRole !== "SUPER_ADMIN"
                              ? "Register your phone & bank details before accessing branch portal"
                              : userRole === "WORKER"
                              ? "View your work shifts, attendance timeclock & cashier station"
                              : userRole === "MANAGER"
                              ? "Manage staff schedules, daily closing ledger, inventory & menu"
                              : "Branch oversight, live sales, closing ledger & manager controls"}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-4" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Terminal Quick Attendance & Cashier Kiosk */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <HomeTerminalActions isUserLoggedIn={true} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-600 font-bold shrink-0 pt-4">
        <span>© 2026 Sambel Ngoweh • Resto OS v2.0</span>
        <div className="flex items-center gap-4">
          <span>Cloudflare Edge Ready</span>
          <span>58mm Thermal Enabled</span>
        </div>
      </footer>
    </div>
  );
}
