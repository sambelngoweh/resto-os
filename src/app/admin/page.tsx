import { auth } from "@/auth";
import { db } from "@/db";
import { restaurants, users, branchDevices } from "@/db/schema";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminDashboard() {
  const session = await auth();
  
  // Security barrier: Super Admin Only
  // @ts-ignore
  if (!session || session.user?.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const allRestaurants = await db.select().from(restaurants);
  const allUsers = await db.select().from(users);
  const allDevices = await db.select().from(branchDevices).orderBy(desc(branchDevices.createdAt));

  return (
    <AdminDashboardClient
      branches={allRestaurants}
      devices={allDevices}
      users={allUsers}
      userSession={session.user}
    />
  );
}
