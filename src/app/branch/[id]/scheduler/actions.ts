"use server"

import { db } from "@/db";
import { shifts, users } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// The Staggered Matrix requested by the user
const SHIFT_MATRIX = [
  { type: "FULL_MORNING", pay: 50000 },
  { type: "PART_MORNING", pay: 30000 },
  { type: "FULL_EVENING", pay: 50000 },
  { type: "PART_EVENING", pay: 30000 },
  { type: "MIDNIGHT", pay: 60000 },
] as const;

export async function generateGachaSchedule(formData: FormData) {
  const session = await auth();
  
  // Get the branch ID from the form data (supports Audit Mode)
  const restaurantId = formData.get("branchId") as string;
  if (!restaurantId) throw new Error("No branch assigned");

  const startDateStr = formData.get("startDate") as string;
  if (!startDateStr) return;

  // 1. Fetch available workers for this specific branch (EXCLUDING Managers & Super Admins)
  const branchStaff = await db.select().from(users).where(
    and(
      eq(users.restaurantId, restaurantId),
      eq(users.role, "WORKER")
    )
  );
  
  // Quick Array Shuffle helper for the "Gacha" effect
  const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);
  
  const startDate = new Date(startDateStr);
  const newShifts = [];
  
  // Track how many shifts each worker gets this week (Max 5 for 2 days off)
  const workerShiftCounts: Record<string, number> = {};
  branchStaff.forEach(w => workerShiftCounts[w.id] = 0);

  // Generate exactly 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    const dateStr = currentDate.toISOString().split("T")[0];

    // Shuffle workers every day so nobody gets stuck with the same shift pattern
    let availableWorkers = shuffle([...branchStaff]);

    for (const slot of SHIFT_MATRIX) {
      let selectedWorker = null;
      
      for (let i = 0; i < availableWorkers.length; i++) {
        const w = availableWorkers[i];
        if (workerShiftCounts[w.id] < 5) {
          selectedWorker = w;
          workerShiftCounts[w.id]++;
          // Remove them from today's pool (can't work 2 shifts on the same day)
          availableWorkers.splice(i, 1);
          break;
        }
      }

      newShifts.push({
        restaurantId,
        userId: selectedWorker ? selectedWorker.id : null, // If null, it's an OPEN SHIFT
        date: dateStr,
        shiftType: slot.type,
        expectedPay: slot.pay,
        status: "SCHEDULED" as const
      });
    }
  }

  // 2. DELETE the old shifts for this specific week so we don't duplicate them!
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const endDateStr = endDate.toISOString().split("T")[0];

  await db.delete(shifts).where(
    and(
      eq(shifts.restaurantId, restaurantId),
      gte(shifts.date, startDateStr),
      lte(shifts.date, endDateStr)
    )
  );

  // 3. Insert the new clean 35 shifts into the database
  if (newShifts.length > 0) {
    await db.insert(shifts).values(newShifts);
  }
  
  // Refresh the UI
  revalidatePath("/branch/scheduler");
}
