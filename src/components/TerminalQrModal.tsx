"use client";

import { useState, useEffect } from "react";
import { createQrSession, pollQrSession } from "@/app/actions/qrSessionActions";
import { QRCodeCanvas } from "qrcode.react";
import { X, Clock, Store, CheckCircle2, RefreshCw, Smartphone, ShieldAlert } from "lucide-react";
import { signIn } from "next-auth/react";

export default function TerminalQrModal({
  isOpen,
  onClose,
  action,
  branchId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  action: "ATTENDANCE" | "POS_LOGIN" | "SWITCH_CASHIER";
  branchId?: string;
  onSuccess?: (data: any) => void;
}) {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pollResult, setPollResult] = useState<any>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Initialize QR Session when modal opens
  useEffect(() => {
    let active = true;
    if (isOpen) {
      setLoading(true);
      setPollResult(null);
      createQrSession(action, branchId).then((res) => {
        if (active) {
          setSessionData(res);
          setLoading(false);
        }
      });
    } else {
      setSessionData(null);
      setPollResult(null);
    }
    return () => {
      active = false;
    };
  }, [isOpen, action, branchId]);

  // Polling loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && sessionData && !sessionData.error && !pollResult) {
      interval = setInterval(async () => {
        const check = await pollQrSession(sessionData.sessionId, sessionData.secretToken);
        if (check.status === "APPROVED") {
          setPollResult(check);
          clearInterval(interval);

          if (action === "POS_LOGIN") {
            // Sign in to NextAuth on this terminal and redirect to branch POS
            setTimeout(async () => {
              const targetBranch = check.restaurantId || branchId || "1";
              await signIn("qr-session", {
                sessionId: sessionData.sessionId,
                secretToken: sessionData.secretToken,
                redirect: true,
                callbackUrl: `/branch/${targetBranch}/pos`,
              });
            }, 1000);
          } else {
            // Attendance or Switch Cashier: celebrate and auto-close
            if (onSuccess) onSuccess(check);
            setTimeout(() => {
              onClose();
            }, 2000);
          }
        }
      }, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, sessionData, pollResult, action, branchId, onClose, onSuccess]);

  if (!isOpen) return null;

  const qrUrl = sessionData && origin && !sessionData.error
    ? `${origin}/qr-auth?session=${sessionData.sessionId}` 
    : "";

  const isPos = action === "POS_LOGIN" || action === "SWITCH_CASHIER";

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 text-center relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Unauthorized Device State */}
        {sessionData?.error === "UNAUTHORIZED_DEVICE" ? (
          <div className="py-6 flex flex-col items-center space-y-4 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Unauthorized Device</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed">
                This browser is not registered as an authorized branch terminal. Attendance and POS QR codes are strictly blocked on personal devices to prevent remote fraud.
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 p-3 rounded-xl text-[11px] font-bold text-orange-700 dark:text-orange-300">
              Please authorize this device in the Branch Portal first.
            </div>
          </div>
        ) : pollResult ? (
          <div className="py-6 flex flex-col items-center space-y-4 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {action === "POS_LOGIN" ? "Opening POS..." : "Success!"}
              </h3>
              <p className="text-slate-900 dark:text-white font-extrabold text-lg mt-1">
                {pollResult.userName}
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold mt-0.5 uppercase tracking-wider">
                {pollResult.attendanceType === "CLOCK_OUT" ? "Clocked Out" : "Clocked In"} at {pollResult.clockTime}
              </p>
            </div>
            <p className="text-slate-400 text-xs">
              {action === "POS_LOGIN" ? "Launching terminal workspace..." : "Screen returning to standby..."}
            </p>
          </div>
        ) : (
          /* QR Display State */
          <>
            <div className={`w-14 h-14 ${isPos ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'} rounded-2xl flex items-center justify-center mb-3`}>
              {isPos ? <Store className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {action === "ATTENDANCE" && "Quick Staff Attendance"}
              {action === "POS_LOGIN" && "Cashier POS Login"}
              {action === "SWITCH_CASHIER" && "Switch Active Cashier"}
            </h3>

            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 mb-6">
              Scan with your phone camera to {action === "ATTENDANCE" ? "clock in or out" : "unlock cashier POS"}
            </p>

            <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-slate-100 dark:border-slate-800 mb-4 flex items-center justify-center">
              {loading || !qrUrl ? (
                <div className="w-[180px] h-[180px] flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : (
                <QRCodeCanvas value={qrUrl} size={180} />
              )}
            </div>

            {/* Backup 6-digit Code */}
            {sessionData?.shortCode && (
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                  Manual Backup Code
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-widest font-mono bg-slate-50 dark:bg-slate-800/80 px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  {sessionData.shortCode}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1.5 rounded-full text-xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Waiting for phone scan...
            </div>
          </>
        )}
      </div>
    </div>
  );
}
