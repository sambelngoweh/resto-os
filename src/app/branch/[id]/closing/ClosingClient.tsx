"use client";

import { useState, useEffect } from "react";
import { Lock, FileText, Calendar, ShoppingCart, DollarSign, CheckCircle2, Unlock } from "lucide-react";
import { getOrCreateLedger, updateMarketSpend, closeRegister, unlockRegister } from "./actions";

export default function ClosingClient({ branchId, ledgers, inventory, role }: { branchId: string, ledgers: any[], inventory: any[], role: string }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [activeLedger, setActiveLedger] = useState<any>(null);
  const [marketSpend, setMarketSpend] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);

  // Snapshot form state
  const [snapshots, setSnapshots] = useState<any[]>([]);

  useEffect(() => {
    const fetchLedger = async () => {
      setIsLoading(true);
      const { ledger, savedSnapshots, autoSoldIngredients } = await getOrCreateLedger(branchId, selectedDate);
      setActiveLedger(ledger);
      setMarketSpend(ledger?.marketSpend?.toString() || "0");
      
      if (savedSnapshots && savedSnapshots.length > 0) {
        // If snapshots exist (either it's CLOSED, or it was UNLOCKED), use the saved data!
        setSnapshots(savedSnapshots);
      } else {
        // If completely empty (first time opening today), initialize from current inventory
        // Automatically inject the calculated auto-depleted amounts from the Recipe Engine!
        const initialSnaps = inventory.map(item => ({
          itemId: item.id,
          itemName: item.itemName,
          category: item.category,
          openingStock: item.currentStock,
          purchased: 0,
          sold: autoSoldIngredients[item.id] || 0, 
          waste: 0,
          closingStock: item.currentStock - (autoSoldIngredients[item.id] || 0)
        }));
        setSnapshots(initialSnaps);
      }
      setIsLoading(false);
    };
    fetchLedger();
  }, [selectedDate, branchId, inventory]);

  const handleUpdateSpend = async () => {
    if (!activeLedger) return;
    await updateMarketSpend(activeLedger.id, branchId, parseInt(marketSpend));
    alert("Market Spend Saved!");
  };

  const handleSnapChange = (itemId: string, field: string, val: string) => {
    const parsed = parseInt(val) || 0;
    setSnapshots(prev => prev.map(s => {
      if (s.itemId !== itemId) return s;
      const updated = { ...s, [field]: parsed };
      // Auto calc closing stock: Opening + Purchased - Sold - Waste
      updated.closingStock = updated.openingStock + updated.purchased - updated.sold - updated.waste;
      return updated;
    }));
  };

  const handleCloseRegister = async () => {
    if (!activeLedger) return;
    if (!confirm("Are you sure you want to CLOSE today's ledger? This will permanently save these stock snapshots and set tomorrow's opening stock.")) return;
    
    setIsLoading(true);
    await closeRegister(activeLedger.id, branchId, snapshots);
    setActiveLedger({ ...activeLedger, status: "CLOSED" });
    setIsLoading(false);
    alert("Register Closed Successfully!");
  };

  const handleUnlockRegister = async () => {
    if (!activeLedger || role !== "SUPER_ADMIN") return;
    if (!confirm("SUPER ADMIN OVERRIDE: Unlock this ledger? This deletes the saved snapshots so they can be re-entered.")) return;
    
    setIsLoading(true);
    await unlockRegister(activeLedger.id, branchId);
    setActiveLedger({ ...activeLedger, status: "OPEN" });
    // Force a reload to rebuild the snaps
    window.location.reload(); 
  };

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="max-w-7xl mx-auto p-6 mt-6 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            Daily Closing & Ledger
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">Lock in stock and cash flow for specific dates.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600 dark:text-blue-400">
            <Calendar className="w-5 h-5" />
          </div>
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-transparent font-black text-slate-900 dark:text-white outline-none pr-4"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500 font-bold animate-pulse">Loading Ledger...</div>
      ) : activeLedger && (
        <div className="space-y-6">
          
          {/* Status Banner */}
          <div className={`p-4 rounded-[1.5rem] border flex items-center justify-between gap-4 ${activeLedger.status === 'CLOSED' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400'}`}>
            <div className="flex items-center gap-4">
              {activeLedger.status === 'CLOSED' ? <CheckCircle2 className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
              <div>
                <h2 className="font-black text-lg">
                  {activeLedger.status === 'CLOSED' ? "Register Closed" : "Register Open"}
                </h2>
                <p className="text-sm font-semibold opacity-80">
                  {activeLedger.status === 'CLOSED' ? "This ledger is locked. Stock amounts have been carried over." : "Fill out your market spend and closing stock, then lock the register at night."}
                </p>
              </div>
            </div>
            {activeLedger.status === 'CLOSED' && role === "SUPER_ADMIN" && (
              <button onClick={handleUnlockRegister} className="bg-emerald-200 hover:bg-emerald-300 dark:bg-emerald-800 dark:hover:bg-emerald-700 text-emerald-900 dark:text-emerald-100 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
                <Unlock className="w-4 h-4" /> Admin Unlock
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-indigo-500" /> Morning Market Spend
              </h3>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                  <input 
                    type="number" 
                    value={marketSpend}
                    onChange={e => setMarketSpend(e.target.value)}
                    disabled={activeLedger.status === 'CLOSED'}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-800 font-black text-slate-900 dark:text-white disabled:opacity-50"
                  />
                </div>
                {activeLedger.status !== 'CLOSED' && (
                  <button onClick={handleUpdateSpend} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-xl transition-all">Save</button>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-3">This offsets your POS sales to calculate Daily Net Profit.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-emerald-500" /> POS Total Sales
              </h3>
              <div className="text-4xl font-black text-slate-900 dark:text-white">
                {formatIDR(activeLedger.totalSales)}
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-2">Auto-synced from orders placed on {selectedDate}.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white text-lg">End of Day Stock Reconciliation</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950">
                    <th className="p-4 font-bold text-slate-500 text-sm">Item Name</th>
                    <th className="p-4 font-bold text-slate-500 text-sm">Opening Stock</th>
                    <th className="p-4 font-bold text-slate-500 text-sm">Market Purchase (+)</th>
                    <th className="p-4 font-bold text-slate-500 text-sm">Sold (-)</th>
                    <th className="p-4 font-bold text-slate-500 text-sm">Waste (-)</th>
                    <th className="p-4 font-bold text-slate-900 dark:text-white text-sm bg-indigo-50 dark:bg-indigo-900/10">Expected Closing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {snapshots.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No snapshots available for this date.</td>
                    </tr>
                  ) : snapshots.map(snap => (
                    <tr key={snap.itemId} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>{snap.itemName}</span>
                          <span className="text-[10px] text-indigo-500 uppercase tracking-widest">{snap.category}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-400">{snap.openingStock}</td>
                      <td className="p-4">
                        {activeLedger.status === 'CLOSED' ? (
                          <span className="font-bold text-slate-700 dark:text-slate-300 pl-4">{snap.purchased}</span>
                        ) : (
                          <input type="number" min="0" value={snap.purchased} onChange={e => handleSnapChange(snap.itemId, 'purchased', e.target.value)} className="w-20 p-2 rounded-lg bg-slate-100 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-800 font-bold text-center" />
                        )}
                      </td>
                      <td className="p-4">
                        {activeLedger.status === 'CLOSED' ? (
                          <span className="font-bold text-slate-700 dark:text-slate-300 pl-4">{snap.sold}</span>
                        ) : (
                          <input type="number" min="0" value={snap.sold} onChange={e => handleSnapChange(snap.itemId, 'sold', e.target.value)} className="w-20 p-2 rounded-lg bg-slate-100 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-800 font-bold text-center" />
                        )}
                      </td>
                      <td className="p-4">
                        {activeLedger.status === 'CLOSED' ? (
                          <span className="font-bold text-red-500 pl-4">{snap.waste}</span>
                        ) : (
                          <input type="number" min="0" value={snap.waste} onChange={e => handleSnapChange(snap.itemId, 'waste', e.target.value)} className="w-20 p-2 rounded-lg bg-slate-100 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-800 font-bold text-center text-red-500" />
                        )}
                      </td>
                      <td className="p-4 font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 text-lg">
                        {snap.closingStock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {activeLedger.status !== 'CLOSED' && (
              <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button onClick={handleCloseRegister} className="bg-red-600 hover:bg-red-700 text-white font-black px-8 py-4 rounded-xl shadow-lg flex items-center gap-2 transition-all">
                  <Lock className="w-5 h-5" /> Close Register & Lock Stock
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
