"use client";

import React, { useState, Fragment } from "react";
import { Package, Plus, Minus, AlertTriangle, Box, Trash2, Edit } from "lucide-react";
import { addInventoryItem, editInventoryItem, adjustStock, deleteInventoryItem } from "./actions";

export default function InventoryClient({ branchId, initialItems, role }: { branchId: string, initialItems: any[], role: string }) {
  const [items, setItems] = useState(initialItems);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lowStockItems = items.filter(item => item.currentStock <= item.lowStockThreshold);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.append("restaurantId", branchId);
      
      if (editingItem) {
        fd.append("id", editingItem.id);
        await editInventoryItem(fd);
      } else {
        await addInventoryItem(fd);
      }
      
      setShowAddModal(false);
      setEditingItem(null);
      window.location.reload(); 
    } catch (err) {
      alert("Error saving item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleAdjust = async (id: string, amount: number) => {
    setItems(items.map(i => i.id === id ? { ...i, currentStock: Math.max(0, i.currentStock + amount) } : i));
    await adjustStock(id, branchId, amount);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this inventory item?")) return;
    setItems(items.filter(i => i.id !== id));
    await deleteInventoryItem(id, branchId);
  };

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // Grouping Logic
  const CATEGORY_ORDER = ["Raw Food", "Vegetables", "Seasoning", "Beverage", "Packaging", "Cleaning Supplies", "Other", "Raw Material"];

  const groupedItems = items.reduce((acc, item) => {
    const cat = item.category || "Raw Material";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
      const idxA = CATEGORY_ORDER.indexOf(a);
      const idxB = CATEGORY_ORDER.indexOf(b);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  const totalInventoryValue = items.reduce((sum, item) => sum + (item.costPerUnit * item.currentStock), 0);

  return (
    <div className="max-w-7xl mx-auto p-6 mt-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Package className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            Inventory & Supply
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">Manage raw materials and track stock levels.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-6 py-2.5 rounded-xl text-right">
            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Total Asset Value</div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">{formatIDR(totalInventoryValue)}</div>
          </div>
          <button onClick={() => { setEditingItem(null); setShowAddModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-sm transition-all h-full">
            <Plus className="w-5 h-5" /> Add New Item
          </button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 p-6 rounded-[2rem] mb-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-amber-800 dark:text-amber-500 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6" /> Low Stock Alerts
          </h2>
          <div className="flex flex-wrap gap-3">
            {lowStockItems.map(item => (
              <div key={`alert-${item.id}`} className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-amber-100 dark:border-amber-800 shadow-sm flex items-center gap-3 font-bold text-sm">
                <span className="text-slate-900 dark:text-white">{item.itemName}</span>
                <span className="text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md">{item.currentStock} {item.unit} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr>
                <th className="p-4 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white">Item Name</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white">Cost / Unit</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white">Status</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white">Current Stock</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white text-right">Total Value</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white text-center">Quick Adjust</th>
                {role === "SUPER_ADMIN" && <th className="p-4 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 font-bold">
                    <Box className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No inventory items tracked yet.
                  </td>
                </tr>
              ) : (
                sortedCategories.map(category => (
                  <React.Fragment key={category}>
                    {/* Category Header Row */}
                    <tr>
                      <td colSpan={7} className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800">
                        <span className="font-black text-sm uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                          {category}
                        </span>
                      </td>
                    </tr>
                    
                    {/* Items within this Category */}
                    {groupedItems[category].map(item => {
                      const isLow = item.currentStock <= item.lowStockThreshold;
                      const isOut = item.currentStock === 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="p-4 border-b border-slate-100 dark:border-slate-800/50 font-bold text-slate-900 dark:text-white pl-6">
                            {item.itemName}
                          </td>
                          <td className="p-4 border-b border-slate-100 dark:border-slate-800/50 font-semibold text-slate-500 dark:text-slate-400">
                            {formatIDR(item.costPerUnit)} <span className="text-xs">/ {item.unit}</span>
                          </td>
                          <td className="p-4 border-b border-slate-100 dark:border-slate-800/50">
                            {isOut ? (
                              <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-md text-xs font-bold">Out of Stock</span>
                            ) : isLow ? (
                              <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-md text-xs font-bold">Low Stock</span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-md text-xs font-bold">Good</span>
                            )}
                          </td>
                          <td className="p-4 border-b border-slate-100 dark:border-slate-800/50 font-black text-lg text-slate-900 dark:text-white">
                            {item.currentStock} <span className="text-sm font-bold text-slate-400">{item.unit}</span>
                          </td>
                          <td className="p-4 border-b border-slate-100 dark:border-slate-800/50 font-black text-emerald-600 dark:text-emerald-400 text-right">
                            {formatIDR(item.costPerUnit * item.currentStock)}
                          </td>
                          <td className="p-4 border-b border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleAdjust(item.id, -1)} className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center transition-colors">
                                <Minus className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleAdjust(item.id, 1)} className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center transition-colors">
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          {role === "SUPER_ADMIN" && (
                            <td className="p-4 border-b border-slate-100 dark:border-slate-800/50 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-indigo-500 transition-colors p-2">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 ml-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-black mb-6 text-slate-900 dark:text-white">
              {editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Item Name</label>
                <input name="itemName" required defaultValue={editingItem?.itemName || ""} placeholder="e.g. Chicken Breast, Plastic Cup" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-800 outline-none font-bold text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select name="category" required defaultValue={editingItem?.category || "Raw Food"} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-800 outline-none font-bold text-slate-900 dark:text-white appearance-none">
                  <option value="Raw Food">Raw Food</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Seasoning">Seasoning</option>
                  <option value="Beverage">Beverage</option>
                  <option value="Packaging">Packaging (Cups, Plastics)</option>
                  <option value="Cleaning Supplies">Cleaning Supplies</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                  <select name="unit" required defaultValue={editingItem?.unit || "kg"} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-800 outline-none font-bold text-slate-900 dark:text-white appearance-none">
                    <option value="kg">kg</option>
                    <option value="gram">gram</option>
                    <option value="pcs">pcs</option>
                    <option value="liters">liters</option>
                    <option value="box">box</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Cost / Unit (Rp)</label>
                  <input name="costPerUnit" type="number" required defaultValue={editingItem?.costPerUnit ?? 0} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-800 outline-none font-bold text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Current Stock</label>
                  <input name="currentStock" type="number" required defaultValue={editingItem?.currentStock ?? 0} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-800 outline-none font-bold text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Low Alert At</label>
                  <input name="lowStockThreshold" type="number" required defaultValue={editingItem?.lowStockThreshold ?? 5} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-800 outline-none font-bold text-slate-900 dark:text-white" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => { setShowAddModal(false); setEditingItem(null); }} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-3 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50">
                {isSubmitting ? "Saving..." : (editingItem ? "Update Item" : "Save Item")}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
