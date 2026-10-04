"use client";

import { useState } from "react";
import { 
  Building2, 
  MapPin, 
  Plus, 
  Users, 
  Monitor, 
  ExternalLink, 
  ShieldAlert, 
  Edit2, 
  X, 
  Check 
} from "lucide-react";
import { createRestaurant, editRestaurant } from "./actions";

interface Branch {
  id: string;
  name: string;
  address: string | null;
}

interface Device {
  id: string;
  restaurantId: string;
  deviceType: "ALL_PURPOSE" | "POS_TERMINAL" | "ATTENDANCE_KIOSK";
  isAuthorized: boolean;
}

interface User {
  id: string;
  restaurantId: string | null;
}

export function BranchesSection({ 
  branches, 
  devices, 
  users 
}: { 
  branches: Branch[]; 
  devices: Device[]; 
  users: User[]; 
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" /> Active Branch Locations
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your physical outlets, staff deployments, and branch terminals
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Branch
        </button>
      </div>

      {/* Branches Grid */}
      {branches.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No branches registered yet</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Get started by adding your first restaurant location or franchise branch.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add First Branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map(branch => {
            const branchStaff = users.filter(u => u.restaurantId === branch.id);
            const branchDevices = devices.filter(d => d.restaurantId === branch.id);
            const activeBranchDevices = branchDevices.filter(d => d.isAuthorized);
            const posCount = branchDevices.filter(d => d.deviceType === "POS_TERMINAL" && d.isAuthorized).length;
            const attCount = branchDevices.filter(d => d.deviceType === "ATTENDANCE_KIOSK" && d.isAuthorized).length;

            return (
              <div 
                key={branch.id} 
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top: Name & Edit */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-base text-slate-900 dark:text-white line-clamp-1">
                        {branch.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{branch.address || "No address provided"}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setEditingBranch(branch)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                      title="Edit Branch Information"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Operational Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 mb-4">
                    {/* Staff Count */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Staff</span>
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {branchStaff.length}
                      </div>
                    </div>

                    {/* Hardware Count */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                        <Monitor className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Terminals</span>
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {activeBranchDevices.length}
                      </div>
                    </div>
                  </div>

                  {/* Device Breakdown Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      {posCount} POS {posCount === 1 ? "Station" : "Stations"}
                    </span>
                    <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                      {attCount} Att POS
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <a
                    href={`/branch/${branch.id}`}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
                  >
                    View Portal <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={`/branch/${branch.id}`}
                    className="bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Audit & Shifts
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Create New Branch</h3>
                  <p className="text-xs text-slate-500">Register a new outlet in the organization</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form 
              action={async (formData) => {
                setIsSubmitting(true);
                await createRestaurant(formData);
                setIsSubmitting(false);
                setIsAddModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Branch Name
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Sambel Ngoweh - Sleman"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Location Address
                </label>
                <input
                  name="address"
                  placeholder="e.g. Jl. Magelang KM 5, Sleman, Yogyakarta"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {editingBranch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Edit Branch Details</h3>
                  <p className="text-xs text-slate-500">Update name or location</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingBranch(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form 
              action={async (formData) => {
                setIsSubmitting(true);
                await editRestaurant(formData);
                setIsSubmitting(false);
                setEditingBranch(null);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editingBranch.id} />

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Branch Name
                </label>
                <input
                  name="name"
                  required
                  defaultValue={editingBranch.name}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Location Address
                </label>
                <input
                  name="address"
                  defaultValue={editingBranch.address || ""}
                  placeholder="Location Address"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
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
