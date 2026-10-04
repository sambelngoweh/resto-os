import { auth } from "@/auth";
import { db } from "@/db";
import { users, restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ArrowLeft, UserCircle, Save, Phone, CreditCard, User, MapPin, HeartPulse, ChefHat, ShieldCheck, Building2, CheckCircle2, Mail, AlertCircle } from "lucide-react";
import Link from "next/link";
import { updateProfile } from "./actions";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; gate?: string }>;
}) {
  const { error, gate } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id)
  });

  if (!user) redirect("/");

  let branchName = "Main Branch";
  if (user.restaurantId) {
    const branch = await db.query.restaurants.findFirst({
      where: eq(restaurants.id, user.restaurantId),
    });
    if (branch) branchName = branch.name;
  }

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between p-6 sm:p-8 font-sans transition-colors">
      
      {/* Top Header */}
      <header className="w-full flex justify-between items-center max-w-6xl mx-auto shrink-0 pb-4">
        <div className="flex items-center gap-3 text-slate-900 dark:text-white">
          <Link
            href="/"
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="bg-slate-900 dark:bg-white p-2.5 rounded-2xl text-white dark:text-slate-900 shadow-md">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none">Profile Settings</h1>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              Staff Payroll & Personal Information
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-800/80 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Active Employee</span>
          </div>
        </div>
      </header>

      {/* Main 2-Column Command Layout */}
      <main className="flex-1 flex items-center justify-center max-w-6xl w-full mx-auto my-auto">
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column (4 cols) - Profile Summary Card */}
          <div className="md:col-span-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between items-center text-center">
            <div className="w-full flex flex-col items-center">
              <div className="relative mb-4">
                {user.image ? (
                  <img
                    src={user.image}
                    alt="Profile"
                    className="w-24 h-24 rounded-full shadow-lg border-4 border-white dark:border-slate-800 object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 text-3xl font-black">
                    {user.name?.[0]}
                  </div>
                )}
                {user.role === "SUPER_ADMIN" && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2 rounded-full shadow-md border-2 border-white dark:border-slate-800" title="Super Admin">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                  {user.role.replace("_", " ")}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full truncate max-w-[140px]">
                  {branchName}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{user.email}</span>
              </div>

              {/* Status checklist */}
              <div className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Payroll Bank</span>
                  <span className={`font-bold flex items-center gap-1 ${user.bankAccount ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {user.bankAccount ? "Registered" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span className="text-slate-500 dark:text-slate-400">WhatsApp Phone</span>
                  <span className={`font-bold flex items-center gap-1 ${user.phone ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {user.phone ? "Connected" : "Not Set"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span className="text-slate-500 dark:text-slate-400">Emergency Line</span>
                  <span className={`font-bold flex items-center gap-1 ${user.emergencyContact ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {user.emergencyContact ? "Saved" : "Not Set"}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full pt-4">
              <Link
                href="/"
                className="w-full bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Operations Hub</span>
              </Link>
            </div>
          </div>

          {/* Right Column (8 cols) - 2-Column Responsive Form */}
          <div className="md:col-span-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Personal & Payroll Information
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Keep your email, phone, and salary account up to date.
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full">
                  Employee Data
                </span>
              </div>

              {gate === "REQUIRED" && (
                <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 p-4 rounded-2xl text-xs font-bold flex items-start gap-3 shadow-md animate-in slide-in-from-top-2 duration-200">
                  <div className="p-1 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-black text-sm mb-0.5">🔒 Branch Access Gate: Profile Completion Required</span>
                    <span>You must provide your WhatsApp Phone Number (for shift schedules & manager contact) and Bank Account Details (for payroll salary transfers) before accessing your branch portal.</span>
                  </div>
                </div>
              )}

              {error === "EMAIL_TAKEN" && (
                <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>That email address is already in use by another staff member. Please use a different email.</span>
                </div>
              )}

              <form action={updateProfile} id="profile-form" className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Full Legal Name
                    </label>
                    <input 
                      type="text" 
                      name="name" 
                      defaultValue={user.name || ""}
                      placeholder="Full Name as on ID" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none transition-all text-xs font-bold"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-500" />
                      Account Email Address
                    </label>
                    <input 
                      type="email" 
                      name="email" 
                      defaultValue={user.email || ""}
                      placeholder="name@company.com" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none transition-all text-xs font-bold"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      WhatsApp Phone Number
                    </label>
                    <input 
                      type="text" 
                      name="phone" 
                      defaultValue={user.phone || ""}
                      placeholder="e.g. 081234567890" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none transition-all text-xs font-bold"
                    />
                  </div>

                  {/* Bank Account */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      Bank Account Details
                    </label>
                    <input 
                      type="text" 
                      name="bankAccount" 
                      defaultValue={user.bankAccount || ""}
                      placeholder="e.g. BCA 8291038472 a/n Budi" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none transition-all text-xs font-bold"
                    />
                  </div>

                  {/* Home Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Residential Address
                    </label>
                    <textarea 
                      name="address" 
                      defaultValue={user.address || ""}
                      placeholder="Full home address" 
                      rows={2}
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none transition-all text-xs font-medium resize-none"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-slate-400" />
                      Emergency Contact Info
                    </label>
                    <textarea 
                      name="emergencyContact" 
                      defaultValue={user.emergencyContact || ""}
                      placeholder="Contact Name & Phone Number" 
                      rows={2}
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none transition-all text-xs font-medium resize-none"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Save Button Bar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                🔒 Protected employee personal records. Saved updates reflect on monthly payroll immediately.
              </span>
              <button
                type="submit"
                form="profile-form"
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2 text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-600 font-bold shrink-0 pt-4">
        <span>© 2026 Sambel Ngoweh • Employee Profile</span>
        <div className="flex items-center gap-4">
          <span>End-to-End Encrypted</span>
          <span>Automatic Payroll Sync</span>
        </div>
      </footer>
    </div>
  );
}
