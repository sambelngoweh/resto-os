import { auth, signIn, signOut } from "@/auth";
import { Store, ShieldCheck, LogOut, ArrowRight, ChefHat, UserCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 flex flex-col font-sans transition-colors">
      
      {/* Sleek Top Navbar */}
      <header className="w-full p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3 text-slate-900 dark:text-white">
          <div className="bg-slate-900 dark:bg-white p-2 rounded-xl text-white dark:text-slate-900 shadow-lg">
            <ChefHat className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter">Resto OS</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session && (
            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border dark:border-slate-700 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wider">SYSTEM ONLINE</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Portal Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 -mt-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center transition-all">
          
          {!session ? (
            <>
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <Store className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Welcome Back</h1>
              <p className="text-slate-500 mb-8 text-sm">Sign in to manage your branches, staff, and POS operations.</p>
              
              <form action={async () => { "use server"; await signIn("google"); }} className="w-full">
                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-xl transition-all font-medium flex items-center justify-center gap-3 shadow-lg shadow-slate-900/20 active:scale-[0.98]">
                  <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Profile Image with Super Admin Badge */}
              <div className="relative mb-6">
                {session.user?.image ? (
                  <img src={session.user.image} alt="Profile" className="w-28 h-28 rounded-full shadow-md border-4 border-white object-cover" />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center text-slate-400 text-3xl font-bold">
                    {session.user?.name?.[0]}
                  </div>
                )}
                {/* @ts-ignore */}
                {session.user?.role === "SUPER_ADMIN" && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2.5 rounded-full shadow-lg border-2 border-white" title="Super Admin">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1">{session.user?.name}</h2>
              <p className="text-slate-400 text-xs mb-8 uppercase tracking-widest font-bold flex items-center justify-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
                {/* @ts-ignore */}
                {session.user?.role.replace("_", " ")}
              </p>

              {/* High-End Navigation Buttons */}
              <div className="w-full space-y-3">
                {/* @ts-ignore */}
                {session.user?.role === "SUPER_ADMIN" && (
                  <a href="/admin" className="w-full group bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white px-6 py-4 rounded-2xl transition-all font-bold flex items-center justify-between border border-blue-100 hover:border-blue-600 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Store className="w-5 h-5" />
                      HQ Dashboard
                    </div>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
                
                {/* @ts-ignore */}
                {session.user?.restaurantId && (
                  <a href={`/branch/${session.user.restaurantId}`} className="w-full group bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white px-6 py-4 rounded-2xl transition-all font-bold flex items-center justify-between border border-emerald-100 hover:border-emerald-600 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Store className="w-5 h-5" />
                      Enter Branch Portal
                    </div>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}

                <a href={`/profile`} className="w-full group bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-6 py-4 rounded-2xl transition-all font-bold flex items-center justify-between border border-indigo-100 hover:border-indigo-600 shadow-sm">
                  <div className="flex items-center gap-3">
                    <UserCircle className="w-5 h-5" />
                    Profile Settings
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>

                <form action={async () => { "use server"; await signOut(); }} className="w-full pt-4">
                  <button className="w-full text-slate-400 hover:text-red-500 hover:bg-red-50 px-6 py-3 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 text-sm">
                    <LogOut className="w-4 h-4" />
                    Secure Sign Out
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
