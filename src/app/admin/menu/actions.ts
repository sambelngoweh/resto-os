"use server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addGlobalProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const price = parseInt(formData.get("price") as string);
  const category = formData.get("category") as string;
  const color = formData.get("color") as string;
  
  if (!name || isNaN(price) || !category) return;

  await db.insert(products).values({
    restaurantId: null, // NULL means Global HQ Item
    name,
    price,
    category,
    color: color || "bg-slate-100 text-slate-700 border-slate-200"
  });

  revalidatePath("/admin/menu");
}

export async function deleteProduct(formData: FormData) {
  const productId = formData.get("productId") as string;
  if (!productId) return;
  await db.delete(products).where(eq(products.id, productId));
  revalidatePath("/admin/menu");
}

export async function updateProduct(id: string, name: string, price: number, category: string, color: string) {
  if (!name || isNaN(price) || !category || !color) return;
  await db.update(products).set({ name, price, category, color }).where(eq(products.id, id));
  revalidatePath("/admin/menu");
}

import { cookies } from "next/headers";

export async function updateCategoryColor(category: string, color: string) {
  await db.update(products).set({ color }).where(eq(products.category, category));
  revalidatePath("/admin/menu");
}

export async function toggleCategoryCookie(category: string, isCollapsed: boolean) {
  const cookieStore = await cookies();
  cookieStore.set(`menu-collapse-${category}`, isCollapsed.toString(), { maxAge: 60 * 60 * 24 * 365 });
}

export async function setThemeCookie(theme: string) {
  const cookieStore = await cookies();
  cookieStore.set("theme", theme, { maxAge: 60 * 60 * 24 * 365 });
}
