"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Palette } from "lucide-react";
import { toggleCategoryCookie, updateCategoryColor } from "./actions";

export function CategoryGroup({ category, children, initialCollapsed }: { category: string; children: React.ReactNode; initialCollapsed: boolean }) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isUpdatingColor, setIsUpdatingColor] = useState(false);

  const toggleCollapse = async () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    await toggleCategoryCookie(category, newState);
  };

  const handleColorChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setIsUpdatingColor(true);
    await updateCategoryColor(category, color);
    setIsUpdatingColor(false);
  };

  return (
    <div className="space-y-3">
      <div 
        className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors -mx-2"
      >
        <div onClick={toggleCollapse} className="flex items-center gap-2 cursor-pointer flex-1">
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-indigo-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
          <h3 className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-xs select-none">
            {category}
          </h3>
        </div>
        
        <div className="flex items-center gap-2 px-2" title="Bulk Set Category Color">
          <Palette className="w-4 h-4 text-slate-400" />
          <input 
            type="color" 
            defaultValue="#f1f5f9"
            onChange={handleColorChange}
            disabled={isUpdatingColor}
            className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent opacity-80 hover:opacity-100 transition-opacity disabled:opacity-30"
          />
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
