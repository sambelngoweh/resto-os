import { auth } from "@/auth";
import { getQrSessionDetails } from "@/app/actions/qrSessionActions";
import QrAuthClient from "./QrAuthClient";
import { ChefHat } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function QrAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; code?: string }>;
}) {
  const { session: sessionId, code } = await searchParams;
  const authSession = await auth();

  const codeOrId = sessionId || code || "";
  let sessionDetails = null;

  if (codeOrId) {
    sessionDetails = await getQrSessionDetails(codeOrId);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col font-sans">
      <header className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 dark:bg-white p-1.5 rounded-lg text-white dark:text-slate-900">
            <ChefHat className="w-5 h-5" />
          </div>
          <span className="font-black text-lg tracking-tight">Resto OS Staff</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <QrAuthClient 
            initialCode={codeOrId} 
            sessionDetails={sessionDetails} 
            user={authSession?.user || null} 
          />
        </div>
      </main>
    </div>
  );
}
