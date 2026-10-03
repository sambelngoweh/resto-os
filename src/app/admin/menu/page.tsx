import { auth } from "@/auth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { addGlobalProduct, deleteProduct } from "./actions";
import { ArrowLeft, BookOpen, Trash2, Plus, Coffee } from "lucide-react";
import { DeleteButton } from "./DeleteButton";

export default async function HQMenuManager() {
  const session = await auth();
  // @ts-ignore
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/");

  // Fetch only Global items (where restaurantId is null)
  const globalMenu = await db.select().from(products).where(isNull(products.restaurantId));

  const categories = ["Food", "Drink", "Snack", "Dessert"];
  const colors = [
    { label: "Orange", value: "bg-orange-100 text-orange-700 border-orange-200" },
    { label: "Red", value: "bg-red-100 text-red-700 border-red-200" },
    { label: "Amber", value: "bg-amber-100 text-amber-700 border-amber-200" },
    { label: "Blue", value: "bg-blue-100 text-blue-700 border-blue-200" },
    { label: "Yellow", value: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    { label: "Emerald", value: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { label: "Stone", value: "bg-stone-100 text-stone-700 border-stone-200" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20">
      
      {/* Top Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-sm">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Global Menu Manager
                <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest shadow-sm">HQ</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">Push items to all branches</p>
            </div>
          </div>
          <a href="/admin" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
            <ArrowLeft className="w-4 h-4" /> Global Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 mt-6 grid lg:grid-cols-12 gap-8">
        
        {/* ADD ITEM FORM */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 sticky top-28">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" /> Create Global Item
            </h2>
            
            <form action={addGlobalProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Item Name</label>
                <input type="text" name="name" required placeholder="e.g. Nasi Goreng Spesial" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Price (Rp)</label>
                <input type="number" name="price" required placeholder="25000" min="0" step="500" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Category</label>
                  <input type="text" name="category" required list="category-suggestions" placeholder="e.g. Main Course" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                  <datalist id="category-suggestions">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Color Theme</label>
                  <select name="color" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-3 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-sm">
                    {colors.map(c => <option key={c.label} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              
              <button type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                Push to All Branches
              </button>
            </form>
          </div>
        </div>

        {/* ACTIVE MENU ITEMS */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 min-h-[500px]">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-indigo-600" /> Live Global Menu
            </h2>
            
            {globalMenu.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 shadow-sm rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-1">No Menu Items Found</h3>
                <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm max-w-sm">The Global Menu is currently empty. Use the form on the left to start pushing items to your branches.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {globalMenu.map(item => (
                  <div key={item.id} className={`${item.color} border p-4 rounded-2xl flex items-center justify-between group relative overflow-hidden transition-all shadow-sm hover:shadow-md`}>
                    <div className="pr-10 relative z-10">
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{item.category}</div>
                      <div className="font-extrabold leading-tight text-lg">{item.name}</div>
                      <div className="font-black mt-1 opacity-80">Rp {item.price.toLocaleString()}</div>
                    </div>
                    
                    <form action={deleteProduct} className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                      <input type="hidden" name="productId" value={item.id} />
                      <DeleteButton />
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
