"use client";

import { useState } from "react";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  UserCircle, 
  Building2, 
  Check, 
  Phone, 
  Filter,
  Briefcase
} from "lucide-react";
import { updateUser } from "./actions";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "WORKER" | "MANAGER" | "SUPER_ADMIN";
  restaurantId: string | null;
  phone: string | null;
}

interface Branch {
  id: string;
  name: string;
  address: string | null;
}

export function StaffManagementSection({ 
  users, 
  branches 
}: { 
  users: User[]; 
  branches: Branch[]; 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [savedUserId, setSavedUserId] = useState<string | null>(null);

  // Filtered users
  const filteredUsers = users.filter(u => {
    const nameMatch = (u.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = (u.phone || "").includes(searchTerm);
    const matchesSearch = nameMatch || emailMatch || phoneMatch;

    const matchesBranch = selectedBranch === "ALL" || 
                          (selectedBranch === "NONE" && !u.restaurantId) ||
                          u.restaurantId === selectedBranch;

    const matchesRole = selectedRole === "ALL" || u.role === selectedRole;

    return matchesSearch && matchesBranch && matchesRole;
  });

  const workerCount = users.filter(u => u.role === "WORKER").length;
  const managerCount = users.filter(u => u.role === "MANAGER").length;
  const adminCount = users.filter(u => u.role === "SUPER_ADMIN").length;

  return (
    <div className="space-y-6">
      
      {/* 1. Quick Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{users.length}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{workerCount}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Branch Workers</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{managerCount}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Branch Managers</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{adminCount}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Super Admins</div>
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
            placeholder="Search staff name, email, phone..."
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
            <option value="NONE">Floating / Unassigned</option>
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Roles</option>
            <option value="WORKER">Worker</option>
            <option value="MANAGER">Manager</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
      </div>

      {/* 3. Staff List */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No team members match criteria</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or filters above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map(user => {
            const assignedBranch = branches.find(b => b.id === user.restaurantId);
            const isSaving = savingUserId === user.id;
            const isSaved = savedUserId === user.id;

            return (
              <div 
                key={user.id} 
                className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3.5 min-w-0 lg:w-72 xl:w-80">
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name || "Avatar"} 
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0" 
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center shrink-0 text-sm">
                      {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {user.name || "Unnamed Employee"}
                      </p>
                      {user.role === "SUPER_ADMIN" && (
                        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" title="Super Admin" />
                      )}
                      {(user.staffType === "SHIFT_TIMER" || /shift\s*timer|timer/i.test(user.name || "")) && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                          ⏱️ Shift Timer
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                      {user.email || "No email"}
                    </p>
                    {user.phone && (
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {user.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Governance Form (Role & Branch Selects with proper widths) */}
                <form 
                  action={async (formData) => {
                    setSavingUserId(user.id);
                    await updateUser(user.id, formData);
                    setSavingUserId(null);
                    setSavedUserId(user.id);
                    setTimeout(() => setSavedUserId(null), 2500);
                  }}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-3 flex-1 lg:justify-end"
                >
                  {/* Role Select */}
                  <div className="w-full sm:w-32">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Role
                    </label>
                    <select 
                      name="role" 
                      defaultValue={user.role} 
                      className="w-full border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-xs h-10"
                    >
                      <option value="WORKER">Worker</option>
                      <option value="MANAGER">Manager</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </div>

                  {/* Staff Type Select */}
                  <div className="w-full sm:w-36">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Type
                    </label>
                    <select 
                      name="staffType" 
                      defaultValue={user.staffType || "REGULAR"} 
                      className="w-full border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-xs h-10"
                    >
                      <option value="REGULAR">Regular</option>
                      <option value="SHIFT_TIMER">⏱️ Shift Timer</option>
                    </select>
                  </div>

                  {/* Branch Assignment Select */}
                  <div className="w-full sm:w-56">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Assigned Branch
                    </label>
                    <select 
                      name="restaurantId" 
                      defaultValue={user.restaurantId || "none"} 
                      className="w-full border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-xs h-10 truncate"
                    >
                      <option value="none">-- Floating / Unassigned --</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Save Button */}
                  <div className="w-full sm:w-auto pt-4 sm:pt-4">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className={`h-10 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 w-full sm:w-auto ${
                        isSaved 
                          ? "bg-emerald-600 text-white" 
                          : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-4 h-4" /> Saved!
                        </>
                      ) : isSaving ? (
                        "Saving..."
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </form>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
