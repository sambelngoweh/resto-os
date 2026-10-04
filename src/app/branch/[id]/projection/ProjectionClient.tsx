"use client";

import { useState } from "react";
import { TrendingUp, Target, DollarSign, Users, PieChart, Store, Smartphone, AlertCircle, FileText, Lock } from "lucide-react";
import { setMonthlyTarget } from "./actions";

interface ProjectionClientProps {
  branchId: string;
  currentMonth: string;
  currentTarget: number;
  totalRevenue: number;
  offlineRevenue: number;
  grabRevenue: number;
  gofoodRevenue: number;
  shopeeRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  totalLaborCost: number;
  laborCostRatio: string;
  ledgers: any[];
}

export default function ProjectionClient({
  branchId, currentMonth, currentTarget, totalRevenue, offlineRevenue, 
  grabRevenue, gofoodRevenue, shopeeRevenue, totalCOGS, grossProfit, 
  totalLaborCost, laborCostRatio, ledgers
}: ProjectionClientProps) {
  const [targetInput, setTargetInput] = useState(currentTarget.toString());
  const [isUpdating, setIsUpdating] = useState(false);

  const progress = currentTarget > 0 ? Math.min((totalRevenue / currentTarget) * 100, 100) : 0;
  
  // Platform Commissions (Estimates: Grab 20%, GoFood 20%, Shopee 20%)
  const onlineFees = (grabRevenue * 0.2) + (gofoodRevenue * 0.2) + (shopeeRevenue * 0.2);
  const netProfit = grossProfit - totalLaborCost - onlineFees;

  const handleUpdateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await setMonthlyTarget(branchId, currentMonth, parseInt(targetInput));
      alert("Target updated successfully!");
    } catch (err) {
      alert("Failed to update target.");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="max-w-7xl mx-auto p-6 mt-6 pb-20">
      
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <TrendingUp className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          Financial Projections
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">Super Admin HQ • Live Monthly Aggregation</p>
      </div>

      {/* Target Tracker */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-pink-500" /> Monthly Sales Target
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold">{new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
          </div>
          
          <form onSubmit={handleUpdateTarget} className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
              <input 
                type="number" 
                value={targetInput} 
                onChange={e => setTargetInput(e.target.value)}
                className="pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 dark:text-white outline-none w-48"
              />
            </div>
            <button disabled={isUpdating} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-sm">
              {isUpdating ? "..." : "Set Target"}
            </button>
          </form>
        </div>

        <div className="relative w-full h-8 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-sm font-bold">
          <span className="text-slate-500 dark:text-slate-400">Current: <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(totalRevenue)}</span></span>
          <span className="text-slate-500 dark:text-slate-400">Goal: <span className="text-pink-600 dark:text-pink-400">{formatCurrency(currentTarget)}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* KPI CARDS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1">Gross Revenue</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(grossProfit)}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-semibold">Sales minus ingredient COGS</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1">Labor Cost Ratio (LCR)</div>
            <div className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
              {laborCostRatio}<span className="text-lg text-slate-400">%</span>
            </div>
            <div className={`text-xs mt-2 font-bold px-2 py-1 inline-block rounded-md w-max ${Number(laborCostRatio) > 20 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
              {Number(laborCostRatio) > 20 ? "⚠️ Dangerously High" : "✅ Healthy Margin"}
            </div>
          </div>

          <div className="col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-[2rem] border border-indigo-800 text-white relative overflow-hidden shadow-xl">
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <PieChart className="w-64 h-64" />
            </div>
            <div className="relative z-10">
              <div className="text-indigo-300 font-bold text-sm mb-2 uppercase tracking-widest">Estimated Net Profit</div>
              <div className="text-4xl font-black mb-4">{formatCurrency(netProfit)}</div>
              <ul className="space-y-1 text-sm font-semibold text-indigo-200">
                <li className="flex justify-between"><span>Gross Profit</span> <span>{formatCurrency(grossProfit)}</span></li>
                <li className="flex justify-between text-pink-400"><span>Platform Fees (~20%)</span> <span>-{formatCurrency(onlineFees)}</span></li>
                <li className="flex justify-between text-red-400"><span>Shift Salaries</span> <span>-{formatCurrency(totalLaborCost)}</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* CHANNEL SPLIT */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-xl text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-500" /> Sales Channel Split
          </h3>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><Store className="w-4 h-4 text-slate-400"/> Offline POS</span>
                <span className="text-slate-900 dark:text-white">{formatCurrency(offlineRevenue)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-slate-600 dark:bg-slate-400 rounded-full" style={{ width: `${totalRevenue > 0 ? (offlineRevenue/totalRevenue)*100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><span className="w-4 h-4 rounded-full bg-green-500 block"/> GrabFood</span>
                <span className="text-slate-900 dark:text-white">{formatCurrency(grabRevenue)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalRevenue > 0 ? (grabRevenue/totalRevenue)*100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><span className="w-4 h-4 rounded-full bg-red-500 block"/> GoFood</span>
                <span className="text-slate-900 dark:text-white">{formatCurrency(gofoodRevenue)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${totalRevenue > 0 ? (gofoodRevenue/totalRevenue)*100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><span className="w-4 h-4 rounded-full bg-orange-500 block"/> ShopeeFood</span>
                <span className="text-slate-900 dark:text-white">{formatCurrency(shopeeRevenue)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${totalRevenue > 0 ? (shopeeRevenue/totalRevenue)*100 : 0}%` }} />
              </div>
            </div>
          </div>
          
          <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/30 flex gap-3 text-sm font-bold text-indigo-800 dark:text-indigo-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-indigo-500" />
            <p>Delivery platforms typically deduct a ~20% commission fee from online sales. This is automatically factored into your Estimated Net Profit.</p>
          </div>
        </div>
      </div>

      {/* Monthly Ledger History Book */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 mt-8 overflow-hidden mb-12">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> Monthly Ledger History Book
          </h2>
          <p className="text-sm font-bold text-slate-500 mt-1">Detailed daily breakdown of your market spend vs. total sales for {currentMonth}.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50">
                <th className="p-4 font-extrabold text-slate-500 dark:text-slate-400 text-sm">Date</th>
                <th className="p-4 font-extrabold text-slate-500 dark:text-slate-400 text-sm">Status</th>
                <th className="p-4 font-extrabold text-slate-500 dark:text-slate-400 text-sm">Total POS Sales</th>
                <th className="p-4 font-extrabold text-slate-500 dark:text-slate-400 text-sm">Market Spend (Petty Cash)</th>
                <th className="p-4 font-extrabold text-slate-900 dark:text-white text-sm bg-indigo-50/50 dark:bg-indigo-900/10">Daily Net Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {ledgers.filter(l => l.date.startsWith(currentMonth)).sort((a, b) => b.date.localeCompare(a.date)).length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No ledgers have been opened this month.</td>
                </tr>
              ) : (
                ledgers.filter(l => l.date.startsWith(currentMonth)).sort((a, b) => b.date.localeCompare(a.date)).map(ledger => {
                  const dailyNet = ledger.totalSales - ledger.marketSpend;
                  return (
                    <tr key={ledger.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-black text-slate-900 dark:text-white">{ledger.date}</td>
                      <td className="p-4">
                        {ledger.status === 'CLOSED' ? (
                          <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 w-max">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-md text-xs font-bold w-max">
                            Open
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{formatCurrency(ledger.totalSales)}</td>
                      <td className="p-4 font-bold text-red-600 dark:text-red-400">-{formatCurrency(ledger.marketSpend)}</td>
                      <td className={`p-4 font-black text-lg bg-indigo-50/20 dark:bg-indigo-900/5 ${dailyNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(dailyNet)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
