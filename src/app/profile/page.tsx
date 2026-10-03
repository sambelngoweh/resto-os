import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ArrowLeft, UserCircle, Save, Phone, CreditCard, User, MapPin, HeartPulse } from "lucide-react";
import Link from "next/link";
import { updateProfile } from "./actions";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id)
  });

  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20 transition-colors">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-extrabold text-slate-900 dark:text-white text-lg">My Profile Settings</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 mt-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4 mb-8">
            {user.image ? (
              <img src={user.image} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-400">
                <UserCircle className="w-8 h-8" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{user.name}</h2>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{user.role.replace("_", " ")}</p>
            </div>
          </div>

          <form action={updateProfile} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Full Legal Name
              </label>
              <input 
                type="text" 
                name="name" 
                defaultValue={user.name || ""}
                placeholder="Full Name" 
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                WhatsApp Phone Number
              </label>
              <input 
                type="text" 
                name="phone" 
                defaultValue={user.phone || ""}
                placeholder="e.g. 081234567890" 
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium outline-none"
              />
              <p className="text-xs text-slate-500 mt-2">Required for WhatsApp digital receipts and notifications.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                Home Address
              </label>
              <textarea 
                name="address" 
                defaultValue={user.address || ""}
                placeholder="Full residential address" 
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium outline-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                Bank Account Details
              </label>
              <textarea 
                name="bankAccount" 
                defaultValue={user.bankAccount || ""}
                placeholder="e.g. BCA 123456789 - Budi Santoso" 
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium outline-none"
              ></textarea>
              <p className="text-xs text-slate-500 mt-2">Required for payroll processing and reimbursements.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-slate-400" />
                Emergency Contact
              </label>
              <input 
                type="text" 
                name="emergencyContact" 
                defaultValue={user.emergencyContact || ""}
                placeholder="Name & Phone Number of contact" 
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button type="submit" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98]">
                <Save className="w-5 h-5" />
                Save Profile Data
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
