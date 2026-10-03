"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton() {
  return (
    <button 
      type="submit" 
      onClick={(e) => {
        if (!window.confirm("Are you sure you want to permanently delete this item from the global menu? It will be removed from all branches.")) {
          e.preventDefault();
        }
      }}
      className="p-3 bg-white dark:bg-slate-900/50 hover:bg-red-500 text-slate-700 dark:text-slate-300 hover:text-white rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100 active:scale-95 backdrop-blur-sm"
      title="Delete Item"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
