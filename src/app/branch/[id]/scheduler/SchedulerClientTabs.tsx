"use client";

import { useState, useRef } from "react";
import { Dices, CalendarDays, Share2, Eye, Download, Copy, Clock, DollarSign, UserCircle, Grid, List } from "lucide-react";
import { generateGachaSchedule, updateShiftRole } from "./actions";
import html2canvas from "html2canvas";

interface SchedulerClientTabsProps {
  restaurantId: string;
  isSuperAdmin: boolean;
  shiftsByDate: Record<string, any[]>;
  staffMap: Record<string, any>;
}

export default function SchedulerClientTabs({
  restaurantId,
  isSuperAdmin,
  shiftsByDate,
  staffMap
}: SchedulerClientTabsProps) {
  const [activeTab, setActiveTab] = useState<"GENERATOR" | "BROADCAST" | "VIEWER">(isSuperAdmin ? "GENERATOR" : "VIEWER");
  const [generateMode, setGenerateMode] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"DAILY" | "MATRIX">("DAILY");
  
  const rosterRef = useRef<HTMLDivElement>(null);
  
  const eligibleWorkers = Object.values(staffMap).filter((u: any) => u.role === "WORKER");
  const regularWorkers = eligibleWorkers.filter((u: any) => u.staffType !== "SHIFT_TIMER" && !/shift\s*timer|timer/i.test(u.name || ""));
  const timerWorkers = eligibleWorkers.filter((u: any) => u.staffType === "SHIFT_TIMER" || /shift\s*timer|timer/i.test(u.name || ""));

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    const formData = new FormData(e.currentTarget);
    formData.append("mode", generateMode);
    
    try {
      await generateGachaSchedule(formData);
      alert("✅ Schedule successfully generated!");
    } catch (err) {
      alert("❌ Failed to generate schedule.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!rosterRef.current) return;
    try {
      const canvas = await html2canvas(rosterRef.current, { backgroundColor: '#1e1b4b' });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Weekly_Roster_${new Date().toLocaleDateString().replace(/\//g, '-')}.png`;
      link.click();
    } catch (err) {
      alert("Failed to render image");
    }
  };

  const handleCopyText = () => {
    let text = "🗓️ *WEEKLY SHIFT ROSTER*\n\n";
    Object.keys(shiftsByDate).sort().forEach(date => {
      const dateObj = new Date(date);
      text += `*${dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}*\n`;
      
      const dayShifts = shiftsByDate[date];
      const getName = (type: string) => {
        const match = dayShifts.find(s => s.shiftType === type);
        return match && match.userId ? staffMap[match.userId]?.name?.split(" ")[0] || "OPEN" : "OPEN";
      };

      text += `☀️ *Shift 1 (Pagi)*:\n`;
      text += `  • 07:00-15:00 (Kasir 60k): ${getName("FULL_MORNING")}\n`;
      text += `  • 09:00-15:00 (Kitchen 40k): ${getName("PART_MORNING")}\n`;
      const s1Special = dayShifts.find(s => s.shiftType === "SPECIAL_MORNING");
      if (s1Special) {
        const specialName = s1Special.userId ? staffMap[s1Special.userId]?.name?.split(" ")[0] || "OPEN" : "OPEN";
        text += `  • 10:00-13:00 (Rush 6k/jam): ${specialName}\n`;
      }
      text += `🌤️ *Shift 2 (Sore/Malam)*:\n`;
      text += `  • 15:00-23:00 (Kasir 60k): ${getName("FULL_EVENING")}\n`;
      text += `  • 15:00-21:00 (Kitchen 40k): ${getName("PART_EVENING")}\n`;
      const mid = dayShifts.find(s => s.shiftType === "MIDNIGHT");
      if (mid) {
        text += `🌙 *Shift 3 (Midnight 23:00-07:00 60k)*: ${mid.userId ? staffMap[mid.userId]?.name?.split(" ")[0] || "OPEN" : "OPEN"}\n`;
      }
      text += `\n`;
    });
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="max-w-7xl mx-auto p-6 mt-6 pb-20">
      
      {/* Tabs Navigation */}
      {isSuperAdmin && (
        <div className="flex flex-col sm:flex-row bg-slate-200/50 dark:bg-slate-900 p-1 rounded-2xl mb-8 border border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab("GENERATOR")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === "GENERATOR" ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm dark:border dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            <Dices className="w-4 h-4" /> Generator
          </button>
          <button 
            onClick={() => setActiveTab("BROADCAST")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === "BROADCAST" ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm dark:border dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            <Share2 className="w-4 h-4" /> Broadcast & Export
          </button>
          <button 
            onClick={() => setActiveTab("VIEWER")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === "VIEWER" ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm dark:border dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            <Eye className="w-4 h-4" /> Staff Viewer
          </button>
        </div>
      )}

      {/* GENERATOR TAB */}
      {activeTab === "GENERATOR" && isSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-slate-100 dark:border-slate-700 mb-8 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4 border-4 border-indigo-100 dark:border-indigo-800">
            <Dices className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">Roll the Gacha Engine</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mb-6 leading-relaxed">
            Automatically generate randomized shifts with guaranteed days off and perfect monthly fairness alignment.
          </p>

          <div className="flex items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 w-full max-w-xl">
            <div className="flex -space-x-3">
              {eligibleWorkers.slice(0, 5).map((w: any) => w.image ? (
                <img key={w.id} src={w.image} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-950 object-cover" title={w.name} />
              ) : (
                <div key={w.id} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-950 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300" title={w.name}>{w.name?.[0]}</div>
              ))}
              {eligibleWorkers.length > 5 && (
                <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  +{eligibleWorkers.length - 5}
                </div>
              )}
            </div>
            <div className="text-sm font-bold text-slate-600 dark:text-slate-300 text-left">
              <span className="block text-indigo-600 dark:text-indigo-400 text-lg">
                {regularWorkers.length} Regular • {timerWorkers.length} Shift Timer
              </span>
              Tracked in Gacha pools
            </div>
          </div>
          
          <form onSubmit={handleGenerate} className="flex flex-col gap-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-xl">
            <input type="hidden" name="branchId" value={restaurantId} />
            
            <div className="flex bg-slate-200/50 dark:bg-slate-900 p-1 rounded-xl border border-transparent dark:border-slate-800">
              <button type="button" onClick={() => setGenerateMode("WEEKLY")} className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${generateMode === "WEEKLY" ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm dark:border dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>Weekly Roll</button>
              <button type="button" onClick={() => setGenerateMode("MONTHLY")} className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${generateMode === "MONTHLY" ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm dark:border dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>Full Month Roll</button>
            </div>

            <div className="flex flex-col gap-3 bg-slate-200/50 dark:bg-slate-900/50 p-5 rounded-2xl text-left border border-slate-200 dark:border-slate-800/50">
              <label className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">Active Shifts</label>
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="includeS1" defaultChecked className="w-5 h-5 accent-indigo-600 rounded-md cursor-pointer" value="true" />
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">☀️ S1 (07-15 & 09-15)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="includeS1Special" defaultChecked className="w-5 h-5 accent-indigo-600 rounded-md cursor-pointer" value="true" />
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">⚡ S1 Special (10-13 @ 6k/h)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="includeS2" defaultChecked className="w-5 h-5 accent-indigo-600 rounded-md cursor-pointer" value="true" />
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">🌤️ S2 (15-23 & 15-21)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="includeS3" className="w-5 h-5 accent-indigo-600 rounded-md cursor-pointer" value="true" />
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">🌙 S3 (23-07)</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input type="date" name="startDate" required className="flex-1 p-4 rounded-2xl border-0 shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 font-bold outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500" />
              <button type="submit" disabled={isGenerating} className="bg-indigo-600 disabled:bg-indigo-400 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-md flex justify-center items-center gap-3 active:scale-[0.98]">
                <Dices className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} /> 
                {isGenerating ? "Generating..." : "Roll Engine"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BROADCAST TAB */}
      {activeTab === "BROADCAST" && isSuperAdmin && (
        <div className="flex flex-col xl:flex-row gap-8">
          
          <div className="w-full xl:w-72 flex flex-col gap-4 shrink-0">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-extrabold text-lg mb-4 text-slate-900 dark:text-white">Export Roster</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Download the graphical roster to share, or copy the formatted text for WhatsApp.</p>
              
              <button onClick={handleDownloadImage} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mb-3 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
                <Download className="w-4 h-4" /> Download Image
              </button>
              
              <button onClick={handleCopyText} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Copy className="w-4 h-4" /> Copy Text
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto bg-slate-100 dark:bg-slate-950 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex justify-center">
            <div ref={rosterRef} className="bg-[#1e1b4b] w-full max-w-2xl rounded-3xl p-8 text-white relative shadow-2xl shrink-0" style={{ fontFamily: "sans-serif" }}>
              <div className="text-center mb-8">
                <div className="inline-block bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xs font-black tracking-widest px-4 py-1.5 rounded-full mb-4 uppercase">
                  🍴 Restaurant Schedule
                </div>
                <h1 className="text-4xl font-black tracking-tight mb-2 text-white">WEEKLY SHIFT ROSTER</h1>
                <p className="text-indigo-300 font-bold">Review your upcoming shifts</p>
              </div>

              <div className="space-y-4 mb-8">
                {Object.keys(shiftsByDate).sort().slice(0, 7).map(date => {
                  const dayShifts = shiftsByDate[date];
                  const mornings = dayShifts.filter(s => s.shiftType.includes("MORNING"));
                  const evenings = dayShifts.filter(s => s.shiftType.includes("EVENING"));
                  const midnights = dayShifts.filter(s => s.shiftType === "MIDNIGHT");

                  const getNames = (shifts: any[]) => {
                    const names = shifts.map(s => s.userId ? staffMap[s.userId]?.name?.split(" ")[0] : "OPEN").filter(Boolean);
                    return names.length > 0 ? names.join(", ") : "None";
                  };

                  return (
                    <div key={date} className="bg-indigo-950/40 border border-indigo-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 justify-between backdrop-blur-sm">
                      <div className="font-extrabold text-lg text-white w-40 shrink-0">
                        {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {mornings.length > 0 && (
                          <div className="bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-orange-100 text-sm font-bold">
                            ☀️ <span className="text-orange-300 text-xs tracking-widest uppercase">S1</span> {getNames(mornings)}
                          </div>
                        )}
                        {evenings.length > 0 && (
                          <div className="bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-yellow-100 text-sm font-bold">
                            🌤️ <span className="text-yellow-300 text-xs tracking-widest uppercase">S2</span> {getNames(evenings)}
                          </div>
                        )}
                        {midnights.length > 0 && (
                          <div className="bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-indigo-100 text-sm font-bold">
                            🌙 <span className="text-indigo-300 text-xs tracking-widest uppercase">S3</span> {getNames(midnights)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEWER TAB */}
      {activeTab === "VIEWER" && (
        <div className="space-y-6">
          
          {/* View Toggle */}
          <div className="flex justify-end mb-4">
            <div className="flex bg-slate-200/50 dark:bg-slate-900 p-1 rounded-xl border border-transparent dark:border-slate-800">
              <button 
                onClick={() => setViewMode("DAILY")} 
                className={`py-2 px-4 font-bold text-sm rounded-lg transition-all flex items-center gap-2 ${viewMode === "DAILY" ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm dark:border dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
              >
                <List className="w-4 h-4" /> Daily View
              </button>
              <button 
                onClick={() => setViewMode("MATRIX")} 
                className={`py-2 px-4 font-bold text-sm rounded-lg transition-all flex items-center gap-2 ${viewMode === "MATRIX" ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm dark:border dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
              >
                <Grid className="w-4 h-4" /> Monthly Matrix
              </button>
            </div>
          </div>

          {/* MATRIX MONTHLY VIEW */}
          {viewMode === "MATRIX" && (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto p-2">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr>
                    <th className="p-4 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 z-10">Worker</th>
                    {Object.keys(shiftsByDate).sort().map(date => (
                      <th key={date} className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-500 dark:text-slate-400 text-center">
                        {new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}<br/>
                        <span className="text-slate-900 dark:text-white">{new Date(date).getDate()}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eligibleWorkers.map((worker: any) => (
                    <tr key={worker.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 border-b border-slate-100 dark:border-slate-800/50 font-bold text-sm flex items-center gap-2 sticky left-0 bg-white dark:bg-slate-900 z-10">
                        {worker.image ? (
                          <img src={worker.image} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]">{worker.name?.[0]}</div>
                        )}
                        {worker.name}
                      </td>
                      {Object.keys(shiftsByDate).sort().map(date => {
                        const shift = shiftsByDate[date].find(s => s.userId === worker.id);
                        
                        let badge = <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">-</span>;
                        if (shift) {
                          if (shift.shiftType === "FULL_MORNING") badge = <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-md text-xs font-bold" title="07:00-15:00 Kasir (60k)">S1-Full</span>;
                          else if (shift.shiftType === "PART_MORNING") badge = <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md text-xs font-bold" title="09:00-15:00 Kitchen (40k)">S1-Part</span>;
                          else if (shift.shiftType === "SPECIAL_MORNING") badge = <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md text-xs font-bold" title="10:00-13:00 Rush (18k / 6k/h)">S1-Rush</span>;
                          else if (shift.shiftType === "FULL_EVENING") badge = <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-md text-xs font-bold" title="15:00-23:00 Kasir (60k)">S2-Full</span>;
                          else if (shift.shiftType === "PART_EVENING") badge = <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md text-xs font-bold" title="15:00-21:00 Kitchen (40k)">S2-Part</span>;
                          else if (shift.shiftType === "MIDNIGHT") badge = <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-md text-xs font-bold" title="23:00-07:00 (60k)">S3</span>;
                          else if (shift.shiftType.includes("MORNING")) badge = <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-md text-xs font-bold">S1</span>;
                          else if (shift.shiftType.includes("EVENING")) badge = <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-md text-xs font-bold">S2</span>;
                        }

                        return (
                          <td key={date} className="p-4 border-b border-slate-100 dark:border-slate-800/50 text-center">
                            {badge}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DETAILED DAILY VIEW */}
          {viewMode === "DAILY" && Object.keys(shiftsByDate).sort().map(date => {
            const dayShifts = shiftsByDate[date];
            const mornings = dayShifts.filter(s => s.shiftType.includes("MORNING"));
            const evenings = dayShifts.filter(s => s.shiftType.includes("EVENING"));
            const midnights = dayShifts.filter(s => s.shiftType === "MIDNIGHT");

            // Tracking OFF DUTY workers
            const scheduledUserIds = new Set(dayShifts.map(s => s.userId).filter(Boolean));
            const offDutyWorkers = eligibleWorkers.filter((w: any) => !scheduledUserIds.has(w.id));

            const renderWorkerSlot = (s: any) => {
              const worker = s.userId ? staffMap[s.userId] : null;
              const isFull = s.shiftType.includes("FULL") || s.shiftType === "MIDNIGHT";
              
              let exactTime = "";
              let shiftDurationLabel = "";
              if (s.shiftType === "FULL_MORNING") {
                exactTime = "07:00 - 15:00";
                shiftDurationLabel = "Full Shift (8h • Kasir)";
              } else if (s.shiftType === "PART_MORNING") {
                exactTime = "09:00 - 15:00";
                shiftDurationLabel = "Part Shift (6h • Kitchen)";
              } else if (s.shiftType === "SPECIAL_MORNING") {
                exactTime = "10:00 - 13:00";
                shiftDurationLabel = "Rush Shift (3h • 6k/jam)";
              } else if (s.shiftType === "FULL_EVENING") {
                exactTime = "15:00 - 23:00";
                shiftDurationLabel = "Full Shift (8h • Kasir)";
              } else if (s.shiftType === "PART_EVENING") {
                exactTime = "15:00 - 21:00";
                shiftDurationLabel = "Part Shift (6h • Kitchen)";
              } else if (s.shiftType === "MIDNIGHT") {
                exactTime = "23:00 - 07:00";
                shiftDurationLabel = "Midnight Shift (8h)";
              } else {
                exactTime = isFull ? "07:00 - 15:00" : "Part Shift";
                shiftDurationLabel = isFull ? "Full Shift (8h)" : "Part Shift";
              }

              const role = s.assignedRole || (isFull ? "CASHIER" : "KITCHEN");

              return (
                <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl border ${worker ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 border-dashed'}`}>
                  <div className="flex items-center gap-3">
                    {worker ? (
                      <>
                        {worker.image ? (
                          <img src={worker.image} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" alt="avatar" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                            {worker.name?.[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                            <span>{worker.name}</span>
                            {(worker.staffType === "SHIFT_TIMER" || /shift\s*timer|timer/i.test(worker.name || "")) && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                                ⏱️ Shift Timer
                              </span>
                            )}
                            {role === "CASHIER" ? (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                💳 Kasir POS
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                                🍳 Kitchen
                              </span>
                            )}
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const nextRole = role === "CASHIER" ? "KITCHEN" : "CASHIER";
                                  await updateShiftRole(s.id, nextRole);
                                }}
                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                title="Toggle between Cashier and Kitchen duty"
                              >
                                ⇄ Change
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            {shiftDurationLabel}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        {s.shiftType === "SPECIAL_MORNING" ? "OPEN SHIFT (Waiting for Shift Timer)" : "OPEN SHIFT"}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">{exactTime}</div>
                    {isSuperAdmin && (
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Rp {s.expectedPay / 1000}k
                        {s.shiftType === "SPECIAL_MORNING" && (
                          <span className="block text-[9px] text-slate-400 font-medium">@ 6k/jam</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            };

            return (
              <div key={date} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-5 border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-500" />
                  {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* MORNING SHIFT */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">☀️ Shift 1: Morning</h4>
                      <span className="text-xs font-bold px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400">07:00 - 15:00</span>
                    </div>
                    <div className="space-y-3">
                      {mornings.map(renderWorkerSlot)}
                    </div>
                  </div>

                  {/* EVENING SHIFT */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">🌤️ Shift 2: Evening</h4>
                      <span className="text-xs font-bold px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400">15:00 - 23:00</span>
                    </div>
                    <div className="space-y-3">
                      {evenings.map(renderWorkerSlot)}
                    </div>
                  </div>

                  {/* MIDNIGHT SHIFT */}
                  <div className="bg-slate-900 dark:bg-slate-950 p-4 rounded-2xl border border-slate-800 dark:border-slate-800">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-extrabold text-white flex items-center gap-2">🌙 Shift 3: Midnight</h4>
                      <span className="text-xs font-bold px-2 py-1 bg-slate-800 rounded-md text-slate-400">23:00 - 07:00</span>
                    </div>
                    <div className="space-y-3">
                      {midnights.map(renderWorkerSlot)}
                    </div>
                  </div>
                </div>

                {/* OFF DUTY SECTION */}
                <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center gap-4">
                  <div className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span> Off Duty Today ({offDutyWorkers.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {offDutyWorkers.map((w: any) => (
                      <div key={w.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                        {w.image ? (
                          <img src={w.image} className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-[8px]">{w.name?.[0]}</div>
                        )}
                        {w.name}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
