"use client";

import { useState } from "react";
import TerminalQrModal from "@/components/TerminalQrModal";
import { Clock, Store, QrCode } from "lucide-react";
import Link from "next/link";

export default function HomeTerminalActions({ isUserLoggedIn }: { isUserLoggedIn: boolean }) {
  const [modalAction, setModalAction] = useState<"ATTENDANCE" | "POS_LOGIN" | null>(null);

  return (
    <>
      <div className="w-full space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Restaurant Kiosk Quick Access
          </span>
          {isUserLoggedIn && (
            <Link
              href="/qr-auth"
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Enter 6-Digit Code</span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => setModalAction("ATTENDANCE")}
            className="flex items-center gap-4 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 transition-all group shadow-sm active:scale-[0.98] text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">Quick Attendance</div>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Clock In / Clock Out</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setModalAction("POS_LOGIN")}
            className="flex items-center gap-4 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/20 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 transition-all group shadow-sm active:scale-[0.98] text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">Cashier POS Login</div>
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">Scan to Unlock Counter</div>
            </div>
          </button>
        </div>
      </div>

      {modalAction && (
        <TerminalQrModal
          isOpen={!!modalAction}
          onClose={() => setModalAction(null)}
          action={modalAction}
        />
      )}
    </>
  );
}
