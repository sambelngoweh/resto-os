"use client";

import { useState } from "react";
import { 
  Building2, 
  Users, 
  Monitor, 
  BookOpen, 
  ShieldAlert, 
  ArrowLeft, 
  ShieldCheck, 
  FileText,
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
  Store,
  Clock
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DeviceManagementSection } from "./DeviceManagementSection";
import { StaffManagementSection } from "./StaffManagementSection";
import { BranchesSection } from "./BranchesSection";

interface Device {
  id: string;
  restaurantId: string;
  name: string;
  deviceToken: string;
  deviceType: "ALL_PURPOSE" | "POS_TERMINAL" | "ATTENDANCE_KIOSK";
  deviceModel: string | null;
  ipAddress: string | null;
  browser: string | null;
  isAuthorized: boolean;
  lastActiveAt: Date | string | null;
  createdAt: Date | string | null;
}

interface Branch {
  id: string;
  name: string;
  address: string | null;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "WORKER" | "MANAGER" | "SUPER_ADMIN";
  restaurantId: string | null;
  phone: string | null;
}

export function AdminDashboardClient({
  branches,
  devices,
  users,
  userSession
}: {
  branches: Branch[];
  devices: Device[];
  users: User[];
  userSession: any;
}) {
  const [activeTab, setActiveTab] = useState<"terminals" | "branches" | "staff" | "catalog">("terminals");

  // Summary counts
  const totalBranches = branches.length;
  const totalDevices = devices.length;
  const activeDevices = devices.filter(d => d.isAuthorized).length;
  const terminatedDevices = devices.filter(d => !d.isAuthorized).length;
  const totalStaff = users.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors pb-16">
      
      {/* 1. HQ Top Navigation Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Logo / Branding */}
          <div className="flex items-center gap-3.5">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-sm text-white flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  HQ Command Hub
                </h1>
                <span className="hidden sm:inline-block bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide mt-1">
                Centralized Multi-Branch Operations & Hardware Fleet
              </p>
            </div>
          </div>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />

            <a 
              href="/admin/logs" 
              className="hidden md:flex items-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-colors border border-slate-800 dark:border-slate-700"
            >
              <FileText className="w-3.5 h-3.5" />
              Audit Logs
            </a>

            {/* User Pill */}
            <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/80">
              {userSession.image ? (
                <img src={userSession.image} alt="Admin" className="w-7 h-7 rounded-full shadow-sm object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  {userSession.name?.slice(0, 1) || "A"}
                </div>
              )}
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:inline max-w-[120px] truncate">
                {userSession.name}
              </span>
            </div>

            {/* Exit Link */}
            <a 
              href="/" 
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5 transition-colors p-2"
              title="Return to Main Portal"
            >
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Exit HQ</span>
            </a>
          </div>

        </div>
      </header>

      {/* 2. Main Executive Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Top Summary Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-200 mb-3 border border-white/10">
                <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Live Enterprise Telemetry
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Enterprise Infrastructure & Devices
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                Oversee authorized POS and attendance terminals across all branches. Remotely terminate compromised hardware or deploy new terminals instantly.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0 bg-white/5 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10">
              <div className="text-center px-2">
                <div className="text-xl sm:text-2xl font-black text-white">{totalBranches}</div>
                <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Branches</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center px-2">
                <div className="text-xl sm:text-2xl font-black text-emerald-400">{activeDevices}</div>
                <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Online Devs</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center px-2">
                <div className="text-xl sm:text-2xl font-black text-white">{totalStaff}</div>
                <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Total Staff</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Modern Segmented Tab Navigation */}
        <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mb-6 overflow-x-auto no-scrollbar">
          
          <button
            onClick={() => setActiveTab("terminals")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "terminals"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Hardware Terminals & Fleet</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === "terminals" 
                ? "bg-white/20 text-white" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {totalDevices}
            </span>
            {terminatedDevices > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title={`${terminatedDevices} terminated devices`} />
            )}
          </button>

          <button
            onClick={() => setActiveTab("branches")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "branches"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Branch Outlets</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === "branches" 
                ? "bg-white/20 text-white" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {totalBranches}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "staff"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Global Staff Roster</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === "staff" 
                ? "bg-white/20 text-white" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {totalStaff}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "catalog"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Global Menu Manager</span>
          </button>

        </div>

        {/* 4. Tab Content Area */}
        <div className="transition-all">
          
          {/* TAB 1: Hardware Terminals & Remote Tracking */}
          {activeTab === "terminals" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-blue-600" /> Authorized Hardware & Terminal Security
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track device activity remotely and terminate compromised POS terminals or Attendance Kiosks in real-time.
                  </p>
                </div>
              </div>

              <DeviceManagementSection devices={devices} branches={branches} />
            </div>
          )}

          {/* TAB 2: Branches Management */}
          {activeTab === "branches" && (
            <div className="space-y-4">
              <BranchesSection branches={branches} devices={devices} users={users} />
            </div>
          )}

          {/* TAB 3: Staff Management */}
          {activeTab === "staff" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" /> Employee Directory & Branch Assignment
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assign staff to branches, change employee roles, and monitor verified WhatsApp contact details.
                  </p>
                </div>
              </div>

              <StaffManagementSection users={users} branches={branches} />
            </div>
          )}

          {/* TAB 4: Catalog & Global Menu */}
          {activeTab === "catalog" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      HQ Master Catalog & Global Menu
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                      Standardize recipes, prices, and categories across all Sambel Ngoweh outlets. Items published from HQ are immediately synced with every branch's POS terminals.
                    </p>
                  </div>

                  <a
                    href="/admin/menu"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all hover:scale-105 shrink-0"
                  >
                    Open Menu Manager <ChevronRight className="w-4 h-4" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Multi-Outlet Sync</div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">Instant Realtime Push</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category Organization</div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">Makanan, Minuman, Paket</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch Overrides</div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">Branch-Specific Pricing Allowed</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

    </div>
  );
}
