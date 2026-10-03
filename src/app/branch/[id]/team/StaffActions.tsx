"use client";

import { Trash2, Edit2 } from "lucide-react";
import { editStaffMember, deleteStaffMember } from "./actions";

export default function StaffActions({ userId, branchId, currentName }: { userId: string, branchId: string, currentName: string }) {
  
  const handleEdit = () => {
    const newName = window.prompt("Edit Staff Name:", currentName);
    if (!newName || newName === currentName) return;

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("branchId", branchId);
    formData.append("name", newName);
    editStaffMember(formData);
  };

  const handleDelete = () => {
    if (!window.confirm(`Are you sure you want to remove ${currentName} from this branch? This cannot be undone.`)) return;
    
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("branchId", branchId);
    deleteStaffMember(formData);
  };

  return (
    <div className="flex items-center gap-1">
      <button onClick={handleEdit} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Name">
        <Edit2 className="w-4 h-4" />
      </button>
      <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove Staff">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
