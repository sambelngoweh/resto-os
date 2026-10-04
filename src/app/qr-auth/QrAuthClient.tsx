"use client";

import { useState } from "react";
import { approveQrSessionFromPhone, getQrSessionDetails } from "@/app/actions/qrSessionActions";
import { signIn } from "next-auth/react";
import { CheckCircle2, Clock, Store, AlertCircle, ArrowRight, ShieldCheck, RefreshCw, ShieldAlert } from "lucide-react";

export default function QrAuthClient({
  initialCode,
  sessionDetails: initialDetails,
  user,
}: {
  initialCode: string;
  sessionDetails: any;
  user: any;
}) {
  const [code, setCode] = useState(initialCode);
  const [details, setDetails] = useState<any>(initialDetails);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [attendanceType, setAttendanceType] = useState<"CLOCK_IN" | "CLOCK_OUT">("CLOCK_IN");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(initialDetails && !initialDetails.success ? initialDetails.error : null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getQrSessionDetails(code);
      if (res.success) {
        setDetails(res);
      } else {
        setError(res.error || "Session not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to lookup code");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!details?.sessionId) return;
    setApproving(true);
    setError(null);
    try {
      const res = await approveQrSessionFromPhone(details.sessionId, { attendanceType });
      if (res.success) {
        setResult(res);
      } else {
        setError(res.error || "Approval failed");
      }
    } catch (err: any) {
      setError(err.message || "Error approving session");
    } finally {
      setApproving(false);
    }
  };

  // 1. User not logged in on phone
  if (!user) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Staff Verification</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Please log into your Google staff account on this phone to confirm attendance or operate the POS terminal.
          </p>
        </div>
        <button
          onClick={() => signIn("google", { callbackUrl: window.location.href })}
          className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors shadow-md"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  // 2. Success Result Screen
  if (result) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-8 rounded-3xl text-center space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
            {result.action === "ATTENDANCE" ? "Attendance Recorded!" : "Terminal Authorized!"}
          </h2>
          <p className="text-emerald-700 dark:text-emerald-400 font-bold text-sm mt-1">
            {result.staffName} ({result.role})
          </p>
          <p className="text-emerald-600 dark:text-emerald-500 text-xs mt-0.5">
            {result.attendanceType === "CLOCK_IN" ? "Clocked In" : "Clocked Out"} at {result.clockTime}
          </p>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl text-xs text-slate-600 dark:text-slate-300 border border-emerald-100 dark:border-emerald-900">
          The restaurant terminal has instantly updated. You can close this window now!
        </div>
      </div>
    );
  }

  // 3. Need to enter 6-digit code if no valid session loaded
  if (!details || !details.success) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-600 dark:text-indigo-400">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Enter Terminal Code</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Type the 6-digit backup code shown below the terminal's QR code.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLookup} className="space-y-4">
          <input
            type="text"
            placeholder="e.g. 839-214"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full text-center tracking-widest text-2xl font-black py-3 px-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:outline-none dark:text-white uppercase placeholder:font-normal placeholder:tracking-normal placeholder:text-sm"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Verify Terminal"}
          </button>
        </form>
      </div>
    );
  }

  // 4. Session Details Loaded - Ready to Confirm
  const isPosAction = details.action === "POS_LOGIN" || details.action === "SWITCH_CASHIER";

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      <div className="text-center">
        <div className={`w-16 h-16 ${isPosAction ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
          {isPosAction ? <Store className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
          {details.branchName}
        </span>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
          {isPosAction ? "Unlock POS Terminal" : "Staff Quick Attendance"}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          {isPosAction 
            ? "Log into the counter POS under your name" 
            : "Record your shift attendance without touching the POS"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-bold uppercase">Staff Name</span>
          <span className="font-extrabold text-slate-900 dark:text-white text-sm">{user.name}</span>
        </div>
        <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-700 pt-2">
          <span className="text-slate-400 font-bold uppercase">Action</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {details.action === "ATTENDANCE" && "Quick Absence (Clock In/Out)"}
            {details.action === "POS_LOGIN" && "Cashier Sign-In"}
            {details.action === "SWITCH_CASHIER" && "Switch Active Cashier"}
          </span>
        </div>
      </div>

      {/* Attendance Type Selector for Attendance Action */}
      {details.action === "ATTENDANCE" && (
        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setAttendanceType("CLOCK_IN")}
            className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
              attendanceType === "CLOCK_IN"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Clock In
          </button>
          <button
            type="button"
            onClick={() => setAttendanceType("CLOCK_OUT")}
            className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
              attendanceType === "CLOCK_OUT"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Clock Out
          </button>
        </div>
      )}

      {/* Dynamic Cashier Role Restriction Alert */}
      {isPosAction && details.cashierEligibility && !details.cashierEligibility.isEligible && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 rounded-2xl text-left space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            Cashier Shift Role Restriction
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            {details.cashierEligibility.reason}
          </p>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-1 border-t border-amber-200/60 dark:border-amber-900/60">
            💡 Only staff scheduled as Cashier can operate the POS. Please use the Quick Attendance button on the terminal to clock in.
          </div>
        </div>
      )}

      {isPosAction && details.cashierEligibility && !details.cashierEligibility.isEligible ? (
        <div className="space-y-2">
          <button
            disabled={true}
            className="w-full bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl cursor-not-allowed text-sm flex items-center justify-center gap-2"
          >
            🚫 POS Login Restricted (Not Cashier)
          </button>
          <p className="text-center text-xs text-slate-400 font-medium">
            Switch to Quick Attendance or request manager approval.
          </p>
        </div>
      ) : (
        <button
          onClick={handleApprove}
          disabled={approving}
          className={`w-full ${
            isPosAction ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
          } disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2`}
        >
          {approving ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {isPosAction ? "Confirm & Open POS" : "Confirm Attendance"}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
