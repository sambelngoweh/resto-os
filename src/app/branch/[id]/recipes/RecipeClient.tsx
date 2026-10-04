"use client";

import { useState } from "react";
import { BookOpen, Plus, Trash2, Box, ArrowRight, Save, ChefHat } from "lucide-react";
import { addRecipeIngredient, removeRecipeIngredient } from "./actions";

interface RecipeClientProps {
  branchId: string;
  products: any[];
  inventory: any[];
  recipes: any[];
}

export default function RecipeClient({ branchId, products, inventory, recipes }: RecipeClientProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(products[0]?.id || null);
  const [selectedInvId, setSelectedInvId] = useState<string>(inventory[0]?.id || "");
  const [quantity, setQuantity] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  const activeProduct = products.find(p => p.id === selectedProductId);
  
  // Filter recipes for the currently selected product
  const currentRecipe = recipes.filter(r => r.productId === selectedProductId);

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedInvId || quantity <= 0) return;
    
    setIsSaving(true);
    await addRecipeIngredient(selectedProductId, selectedInvId, quantity, branchId);
    setIsSaving(false);
  };

  const handleRemove = async (recipeId: string) => {
    await removeRecipeIngredient(recipeId, branchId);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 mt-6 pb-20">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <ChefHat className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          Recipe Engine (BOM)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">Map your Global Menu to your Local Raw Materials to automate inventory depletion.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left: Global Menu List */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">1. Select Menu Item</h2>
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 p-4 h-[600px] overflow-y-auto space-y-2">
            {products.map(p => {
              const isSelected = p.id === selectedProductId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500'}`}
                >
                  <div className="font-extrabold truncate">{p.name}</div>
                  <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{p.category}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Recipe Builder */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            2. Build Bill of Materials <ArrowRight className="w-5 h-5 text-slate-400" /> {activeProduct?.name || "Select an item"}
          </h2>
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800">
            {/* Add Form */}
            <form onSubmit={handleAddIngredient} className="flex flex-col md:flex-row gap-4 items-end mb-8 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Raw Material</label>
                <select 
                  value={selectedInvId} 
                  onChange={e => setSelectedInvId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {inventory.length === 0 && <option value="">No inventory items found...</option>}
                  {inventory.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.itemName} ({inv.category})</option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-32">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Qty Used</label>
                <input 
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                />
              </div>
              <button disabled={isSaving || !selectedInvId} type="submit" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 h-[50px]">
                <Plus className="w-5 h-5" /> Add
              </button>
            </form>

            {/* Current Recipe List */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Box className="w-5 h-5 text-slate-400" />
                <h3 className="font-extrabold text-slate-700 dark:text-slate-300">Ingredients (When 1 {activeProduct?.name} is sold)</h3>
              </div>
              
              {currentRecipe.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 font-bold">
                  No ingredients added yet. This item will not auto-deplete inventory.
                </div>
              ) : (
                currentRecipe.map(ing => (
                  <div key={ing.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-black flex items-center justify-center text-lg shadow-inner">
                        {ing.quantity}x
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white text-lg">{ing.itemName}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{ing.category}</div>
                      </div>
                    </div>
                    <button onClick={() => handleRemove(ing.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
