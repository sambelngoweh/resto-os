"use client";

import { Edit2, ShieldAlert } from "lucide-react";
import { editRestaurant } from "./actions";

export function BranchActions({ branch }: { branch: { id: string, name: string, address: string | null } }) {
  const handleEdit = () => {
    const newName = window.prompt("Edit Branch Name:", branch.name);
    if (newName === null) return;
    
    const newAddress = window.prompt("Edit Branch Address:", branch.address || "");
    if (newAddress === null) return;
    
    if (newName.trim() === "") {
        alert("Branch name cannot be empty.");
        return;
    }

    const formData = new FormData();
    formData.append("id", branch.id);
    formData.append("name", newName);
    formData.append("address", newAddress);
    editRestaurant(formData);
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button onClick={handleEdit} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Edit Branch">
        <Edit2 className="w-4 h-4" />
      </button>
      <a href={`/branch/${branch.id}`} className="bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm">
        <ShieldAlert className="w-3 h-3" /> Audit
      </a>
    </div>
  );
}
