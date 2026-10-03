"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function authorizeDevice() {
  const cookieStore = await cookies();
  // Set a cookie valid for 10 years to permanently tag this browser
  cookieStore.set("resto_device_auth", "true", { 
    maxAge: 60 * 60 * 24 * 365 * 10,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
  revalidatePath("/", "layout");
}

export async function deauthorizeDevice() {
  const cookieStore = await cookies();
  cookieStore.delete("resto_device_auth");
  revalidatePath("/", "layout");
}
