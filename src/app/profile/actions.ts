"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim();
  const bankAccount = (formData.get("bankAccount") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const emergencyContact = (formData.get("emergencyContact") as string)?.trim();

  // If email is changed, ensure another user doesn't already have it
  if (email) {
    const existing = await db.query.users.findFirst({
      where: and(
        eq(users.email, email),
        ne(users.id, session.user.id)
      )
    });
    if (existing) {
      redirect("/profile?error=EMAIL_TAKEN");
    }
  }

  await db.update(users)
    .set({ 
      name: name || undefined,
      email: email || undefined,
      phone, 
      bankAccount,
      address,
      emergencyContact
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/profile");
  revalidatePath("/");
  redirect("/"); // go back to dashboard after saving
}
