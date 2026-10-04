"use client";

import { useState } from "react";
import { Edit2, Check, X, Trash2 } from "lucide-react";
import { deleteProduct, updateProduct } from "./actions";
import { DeleteButton } from "./DeleteButton";

export function ProductCard({ item }: { item: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price);
  const [category, setCategory] = useState(item.category);
  const [color, setColor] = useState(item.color || "bg-orange-100 text-orange-700 border-orange-200");
  const [isSaving, setIsSaving] = useState(false);

  const colors = [
    { label: "Orange", value: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50" },
    { label: "Red", value: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50" },
    { label: "Blue", value: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50" },
    { label: "Green", value: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" },
    { label: "Purple", value: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50" },
    { label: "Yellow", value: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50" },
    { label: "Pink", value: "bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800/50" },
    { label: "Gray", value: "bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700" }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await updateProduct(item.id, name, parseInt(price), category, color);
    setIsEditing(false);
    setIsSaving(false);
  };

  if (isEditing) {
    return (
      <div className={`${color} border p-3 rounded-2xl flex flex-col md:flex-row items-center gap-3 relative shadow-sm`}>
        <input 
          type="text" 
          value={category} 
          onChange={e => setCategory(e.target.value)} 
          className="text-xs font-black uppercase tracking-widest bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2 outline-none w-full md:w-[15%]"
        />
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="font-extrabold text-base bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2 outline-none w-full md:flex-1"
        />
        <input 
          type="number" 
          value={price} 
          onChange={e => setPrice(e.target.value)} 
          className="font-black opacity-80 bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2 outline-none w-full md:w-[15%]"
        />
        <input 
          type="color"
          value={color?.startsWith("#") ? color : "#f1f5f9"}
          onChange={e => setColor(e.target.value)}
          className="w-10 h-10 p-0 border-0 rounded cursor-pointer bg-transparent"
          title="Pick custom color"
        />
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={handleSave} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600 transition-colors text-white p-2 rounded-xl flex-1 md:flex-none font-bold flex justify-center items-center shadow-sm">
            <Check className="w-5 h-5" />
          </button>
          <button onClick={() => setIsEditing(false)} className="bg-slate-400 hover:bg-slate-500 transition-colors text-white p-2 rounded-xl flex-1 md:flex-none font-bold flex justify-center items-center shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const isHex = item.color?.startsWith("#");
  const cardStyle = isHex ? { backgroundColor: item.color, borderColor: item.color } : {};
  const cardClass = isHex 
    ? "border p-4 rounded-2xl flex items-center justify-between group relative overflow-hidden transition-all shadow-sm hover:shadow-md text-slate-900 dark:text-slate-100 dark:bg-opacity-20" 
    : `${item.color} border p-4 rounded-2xl flex items-center justify-between group relative overflow-hidden transition-all shadow-sm hover:shadow-md`;

  return (
    <div className={cardClass} style={cardStyle}>
      <div className="flex items-center gap-4 flex-1 pr-4 relative z-10">
        <div className="font-extrabold text-lg flex-1 truncate">{item.name}</div>
        <div className="font-black opacity-80 whitespace-nowrap bg-white/40 dark:bg-black/20 px-3 py-1 rounded-lg">Rp {item.price.toLocaleString('id-ID')}</div>
      </div>
      
      <div className="flex items-center gap-2 z-20">
        <button onClick={() => setIsEditing(true)} className="p-2.5 bg-white/60 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 rounded-xl transition-colors shadow-sm">
          <Edit2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
        </button>
        <form action={deleteProduct}>
          <input type="hidden" name="productId" value={item.id} />
          <DeleteButton />
        </form>
      </div>
    </div>
  );
}
