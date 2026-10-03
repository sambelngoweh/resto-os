"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const bankAccount = formData.get("bankAccount") as string;
  const address = formData.get("address") as string;
  const emergencyContact = formData.get("emergencyContact") as string;

  await db.update(users)
    .set({ 
      name: name || undefined, // prevent wiping name if empty
      phone, 
      bankAccount,
      address,
      emergencyContact
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/profile");
  redirect("/"); // go back to dashboard after saving
}
