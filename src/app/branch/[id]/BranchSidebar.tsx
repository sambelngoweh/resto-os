"use client";
import { useState } from "react";
import { useSearchParams, useParams, usePathname } from "next/navigation";
import { Store, CalendarDays, Users, Clock, ChevronLeft, ChevronRight, Building2, ShieldAlert, ArrowLeft, Eye, TrendingUp, Package, FileText, BookOpen } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function BranchSidebar({ realRole, userRestaurantId, branchName, isAuthorizedDevice }: { realRole: string, userRestaurantId: string, branchName: string, isAuthorizedDevice: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const id = params.id as string;
  const viewAs = searchParams.get("viewAs");
  
  const isActuallySuperAdmin = realRole === "SUPER_ADMIN";
  const effectiveRole = isActuallySuperAdmin && viewAs ? viewAs : realRole;
  
  const q = viewAs ? `?viewAs=${viewAs}` : '';

  // Device Lock Logic: Super Admins & Managers can always access. Workers can ONLY access on an authorized device.
  const showDeviceLockedFeatures = effectiveRole !== "WORKER" || isAuthorizedDevice;

  const navItems = [
    { name: "My Timeclock", href: `/branch/${id}/timeclock${q}`, icon: Clock, show: showDeviceLockedFeatures },
    { name: "POS Terminal", href: `/branch/${id}/pos${q}`, icon: Store, show: showDeviceLockedFeatures },
    { name: "Shift Scheduler", href: `/branch/${id}/scheduler${q}`, icon: CalendarDays, show: effectiveRole !== "WORKER" },
    { name: "Team & Payroll", href: `/branch/${id}/team${q}`, icon: Users, show: effectiveRole !== "WORKER" },
    { name: "Inventory & Supply", href: `/branch/${id}/inventory${q}`, icon: Package, show: effectiveRole !== "WORKER" },
    { name: "Recipe Builder", href: `/branch/${id}/recipes${q}`, icon: BookOpen, show: effectiveRole !== "WORKER" },
    { name: "Daily Closing", href: `/branch/${id}/closing${q}`, icon: FileText, show: effectiveRole !== "WORKER" },
    { name: "Financial Projection", href: `/branch/${id}/projection${q}`, icon: TrendingUp, show: effectiveRole === "SUPER_ADMIN" },
  ];

  return (
    <div className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen transition-all duration-300 flex flex-col relative ${collapsed ? 'w-20' : 'w-72'}`}>
      
      {/* Collapse Toggle Button */}
      <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-1 shadow-sm hover:bg-slate-50 dark:bg-slate-950 z-50">
        {collapsed ? <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" /> : <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
      </button>
      
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 h-20">
        <div className={`${isActuallySuperAdmin && userRestaurantId !== id ? 'bg-amber-500' : 'bg-emerald-600'} p-2 rounded-xl shrink-0 shadow-sm`}>
          <Building2 className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="font-black text-slate-900 dark:text-white text-sm truncate" title={branchName}>{branchName}</h2>
            {isActuallySuperAdmin && userRestaurantId !== id ? (
              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-1 w-max mt-0.5"><ShieldAlert className="w-2.5 h-2.5"/> Audit Mode</span>
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest truncate">Branch Portal</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {!collapsed && <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">Applications</div>}
        {navItems.filter(item => item.show).map(item => {
          const isActive = pathname === item.href.split('?')[0];
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 hover:text-slate-900 dark:text-white'} ${collapsed ? 'justify-center' : ''}`}>
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400 dark:text-slate-500'}`} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Controls */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
        {!collapsed && isActuallySuperAdmin && (
          <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-inner">
            <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] px-1 flex items-center gap-1"><Eye className="w-3 h-3"/> View As:</span>
            <div className="grid grid-cols-3 gap-1">
              <Link href={`/branch/${id}?viewAs=SUPER_ADMIN`} className={`py-2 text-center rounded-lg font-bold transition-colors ${!viewAs || viewAs === 'SUPER_ADMIN' ? 'bg-white dark:bg-slate-900 shadow-sm text-amber-600 border border-slate-200 dark:border-slate-800/60' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Admin</Link>
              <Link href={`/branch/${id}?viewAs=MANAGER`} className={`py-2 text-center rounded-lg font-bold transition-colors ${viewAs === 'MANAGER' ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 border border-slate-200 dark:border-slate-800/60' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Mgr</Link>
              <Link href={`/branch/${id}?viewAs=WORKER`} className={`py-2 text-center rounded-lg font-bold transition-colors ${viewAs === 'WORKER' ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600 border border-slate-200 dark:border-slate-800/60' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Staff</Link>
            </div>
          </div>
        )}
        
        <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : 'justify-between'}`}>
          <Link href={isActuallySuperAdmin ? "/admin" : "/"} className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all flex-1 ${collapsed ? 'justify-center w-full' : ''}`}>
            <ArrowLeft className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{isActuallySuperAdmin ? "Exit Audit Mode" : "Return Home"}</span>}
          </Link>
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}
