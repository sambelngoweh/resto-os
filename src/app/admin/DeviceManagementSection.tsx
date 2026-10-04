"use client";

import { useState } from "react";
import { 
  Tablet, 
  Monitor, 
  Clock, 
  Store, 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Power, 
  PowerOff,
  RefreshCw, 
  Building2, 
  Copy, 
  Check, 
  Smartphone, 
  Activity, 
  AlertTriangle,
  X,
  Edit2,
  Laptop,
  Globe,
  Wifi,
  Link2
} from "lucide-react";
import { 
  terminateDeviceAdmin, 
  reactivateDeviceAdmin, 
  deleteDeviceAdmin, 
  enrollDeviceAdmin, 
  updateDeviceDetails,
  bindCurrentDeviceToTerminal
} from "./actions";

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

export function DeviceManagementSection({ 
  devices, 
  branches 
}: { 
  devices: Device[]; 
  branches: Branch[]; 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // KPIs
  const totalCount = devices.length;
  const activeCount = devices.filter(d => d.isAuthorized).length;
  const posCount = devices.filter(d => d.deviceType === "POS_TERMINAL" && d.isAuthorized).length;
  const attCount = devices.filter(d => d.deviceType === "ATTENDANCE_KIOSK" && d.isAuthorized).length;
  const terminatedCount = devices.filter(d => !d.isAuthorized).length;

  // Filtered devices
  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.deviceToken.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (d.deviceModel || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (d.ipAddress || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === "ALL" || d.restaurantId === selectedBranch;
    const matchesType = selectedType === "ALL" || d.deviceType === selectedType;
    const matchesStatus = selectedStatus === "ALL" || 
                          (selectedStatus === "ACTIVE" && d.isAuthorized) || 
                          (selectedStatus === "TERMINATED" && !d.isAuthorized);
    return matchesSearch && matchesBranch && matchesType && matchesStatus;
  });

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const formatLastActive = (dateInput: Date | string | null) => {
    if (!dateInput) return "Never active";
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return "Online just now";
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    if (diffDays === 1) return "Active yesterday";
    return `Active on ${date.toLocaleDateString("id-ID", { month: "short", day: "numeric" })}`;
  };

  const isRecentlyActive = (dateInput: Date | string | null) => {
    if (!dateInput) return false;
    const diffMs = new Date().getTime() - new Date(dateInput).getTime();
    return diffMs < 1000 * 60 * 30; // within 30 minutes
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Fleet KPI Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{activeCount} / {totalCount}</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Authorized Terminals</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{posCount} Active</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">POS Registers</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{attCount} Active</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attendance Kiosks</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{terminatedCount} Terminated</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revoked Devices</div>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search terminal name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Branches ({branches.length})</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="POS_TERMINAL">🛒 POS Terminals</option>
            <option value="ATTENDANCE_KIOSK">⏰ Attendance POS (Att POS)</option>
            <option value="ALL_PURPOSE">⚙️ All-Purpose</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">🟢 Authorized / Active</option>
            <option value="TERMINATED">🔴 Terminated / Revoked</option>
          </select>

          {/* Enroll New Device Button */}
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" /> Enroll Terminal
          </button>
        </div>
      </div>

      {/* 3. Device Fleet List / Cards */}
      {filteredDevices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Monitor className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No hardware devices found</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or register a new terminal for one of your branches.
          </p>
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Enroll New Terminal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map(device => {
            const branch = branches.find(b => b.id === device.restaurantId);
            const isOnline = isRecentlyActive(device.lastActiveAt);

            return (
              <div 
                key={device.id} 
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  device.isAuthorized 
                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md" 
                    : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 opacity-90"
                }`}
              >
                <div>
                  {/* Top Header: Icon & Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        !device.isAuthorized
                          ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                          : device.deviceType === "POS_TERMINAL"
                          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                          : device.deviceType === "ATTENDANCE_KIOSK"
                          ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                          : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      }`}>
                        {device.deviceType === "POS_TERMINAL" ? (
                          <Store className="w-5 h-5" />
                        ) : device.deviceType === "ATTENDANCE_KIOSK" ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <Monitor className="w-5 h-5" />
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight line-clamp-1">
                          {device.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-1">
                            {branch?.name || "Unassigned Branch"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {device.isAuthorized ? (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                        isOnline
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                        {isOnline ? "Online" : "Authorized"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 shrink-0">
                        <PowerOff className="w-3 h-3" /> Terminated
                      </span>
                    )}
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    {/* Device Role Badge */}
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      device.deviceType === "POS_TERMINAL"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : device.deviceType === "ATTENDANCE_KIOSK"
                        ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                        : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    }`}>
                      {device.deviceType === "POS_TERMINAL" 
                        ? "🛒 POS Terminal" 
                        : device.deviceType === "ATTENDANCE_KIOSK" 
                        ? "⏰ Att POS Kiosk" 
                        : "⚙️ All-Purpose"}
                    </span>

                    {/* Remote Tracking: Last Active */}
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Activity className="w-3 h-3 text-slate-400" />
                      {formatLastActive(device.lastActiveAt)}
                    </span>
                  </div>

                  {/* Hardware Model & IP Telemetry Block */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 mb-4">
                    {/* Hardware Model & Browser */}
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5 truncate">
                        <Laptop className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{device.deviceModel || "Device Model Unlinked (Pending Sync)"}</span>
                      </div>
                      {device.browser && (
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 shrink-0">
                          {device.browser}
                        </span>
                      )}
                    </div>

                    {/* Network & IP Address */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5 truncate">
                        <Globe className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="font-mono truncate">{device.ipAddress ? `IP: ${device.ipAddress}` : "IP: Waiting Connection"}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 font-mono text-[10px] text-slate-400">
                        <span>{device.deviceToken ? `dev_${device.deviceToken.slice(0, 4)}...${device.deviceToken.slice(-3)}` : ""}</span>
                        <button
                          onClick={() => handleCopy(device.deviceToken)}
                          title="Copy Full Token"
                          className="hover:text-slate-600 dark:hover:text-slate-200 ml-1"
                        >
                          {copiedToken === device.deviceToken ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Quick Bind Button if device was enrolled remotely without physical device attached */}
                    {!device.deviceModel && (
                      <form action={bindCurrentDeviceToTerminal.bind(null, device.id)} className="pt-2">
                        <button
                          type="submit"
                          className="w-full py-1.5 px-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                          title="Click to authorize and bind this current machine to this terminal slot"
                        >
                          <Link2 className="w-3.5 h-3.5 text-blue-500" /> Bind & Authorize THIS Computer Now
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Bottom Remote Action Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingDevice(device)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs font-bold"
                      title="Edit Device Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <form action={async () => {
                      if (confirm(`Are you sure you want to permanently delete '${device.name}'?`)) {
                        await deleteDeviceAdmin(device.id);
                      }
                    }}>
                      <button
                        type="submit"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs font-bold"
                        title="Delete Device Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>

                  {/* Remote Terminate / Reactivate Button */}
                  {device.isAuthorized ? (
                    <form action={terminateDeviceAdmin.bind(null, device.id)}>
                      <button
                        type="submit"
                        className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        title="Instantly block and terminate this device remotely"
                      >
                        <Power className="w-3.5 h-3.5" /> Terminate Remotely
                      </button>
                    </form>
                  ) : (
                    <form action={reactivateDeviceAdmin.bind(null, device.id)}>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        title="Re-authorize this terminal to use POS and Attendance"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Reactivate Device
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Enroll New Device Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Enroll Terminal</h3>
                  <p className="text-xs text-slate-500">Authorize hardware device for a branch</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form 
              action={async (formData) => {
                setIsSubmitting(true);
                await enrollDeviceAdmin(formData);
                setIsSubmitting(false);
                setIsEnrollModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Terminal Name
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Counter Tablet 2, Barista Register"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Assigned Branch
                </label>
                <select
                  name="restaurantId"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Device Purpose / Role
                </label>
                <select
                  name="deviceType"
                  defaultValue="POS_TERMINAL"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="POS_TERMINAL">🛒 POS Terminal (Cashier & Orders)</option>
                  <option value="ATTENDANCE_KIOSK">⏰ Attendance POS (Att POS / Timeclock Kiosk)</option>
                  <option value="ALL_PURPOSE">⚙️ All-Purpose (Both POS & Timeclock)</option>
                </select>
              </div>

              {/* Immediate Device Pairing Option */}
              <div className="bg-blue-50/80 dark:bg-blue-950/40 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="authCurrentCheckbox"
                  name="authorizeCurrentDevice"
                  value="true"
                  defaultChecked={true}
                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="authCurrentCheckbox" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <span className="font-extrabold text-slate-900 dark:text-white block">
                    Link & Authorize THIS Computer Immediately
                  </span>
                  Automatically captures this computer's hardware model, browser, and network IP.
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Enroll & Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Device Modal */}
      {editingDevice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Edit Device Details</h3>
                  <p className="text-xs text-slate-500">Update configuration for {editingDevice.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingDevice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form 
              action={async (formData) => {
                setIsSubmitting(true);
                await updateDeviceDetails(editingDevice.id, formData);
                setIsSubmitting(false);
                setEditingDevice(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Terminal Name
                </label>
                <input
                  name="name"
                  required
                  defaultValue={editingDevice.name}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Assigned Branch
                </label>
                <select
                  name="restaurantId"
                  defaultValue={editingDevice.restaurantId}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Device Purpose / Role
                </label>
                <select
                  name="deviceType"
                  defaultValue={editingDevice.deviceType}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="POS_TERMINAL">🛒 POS Terminal</option>
                  <option value="ATTENDANCE_KIOSK">⏰ Attendance POS (Att POS)</option>
                  <option value="ALL_PURPOSE">⚙️ All-Purpose</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDevice(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
