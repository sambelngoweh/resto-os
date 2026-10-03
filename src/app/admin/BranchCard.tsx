"use client";
import { useState } from "react";
import { MapPin, ShieldAlert, Edit2, Check, X } from "lucide-react";
import { editRestaurant } from "./actions";

export function BranchCard({ branch }: { branch: { id: string, name: string, address: string | null } }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <li className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-blue-400 shadow-sm flex flex-col transition-colors">
        <form action={(formData) => { editRestaurant(formData); setIsEditing(false); }} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={branch.id} />
          
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Branch Name</label>
            <input name="name" defaultValue={branch.name} className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" required />
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Address</label>
            <input name="address" defaultValue={branch.address || ""} placeholder="No address provided" className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
          
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
              <X className="w-3 h-3" /> Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm">
              <Check className="w-3 h-3" /> Save Changes
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col hover:border-blue-300 dark:hover:border-blue-500 transition-colors group">
      <div className="flex justify-between items-start gap-4">
        
        {/* Branch Info - Min Width 0 allows truncation */}
        <div className="min-w-0 flex-1">
          <span className="font-bold text-slate-900 dark:text-white block truncate text-base">
            {branch.name}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{branch.address || "No address provided"}</span>
          </span>
        </div>
        
        {/* Controls - Shrink 0 keeps them fixed size */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Edit Branch">
            <Edit2 className="w-4 h-4" />
          </button>
          <a href={`/branch/${branch.id}`} className="bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm">
            <ShieldAlert className="w-3 h-3" /> Audit
          </a>
        </div>
        
      </div>
    </li>
  )
}
