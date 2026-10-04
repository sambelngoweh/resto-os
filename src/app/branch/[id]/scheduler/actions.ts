"use server"

import { db } from "@/db";
import { shifts, users } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function generateGachaSchedule(formData: FormData) {
  const session = await auth();
  
  // Get the branch ID from the form data (supports Audit Mode)
  const restaurantId = formData.get("branchId") as string;
  if (!restaurantId) throw new Error("No branch assigned");

  const startDateStr = formData.get("startDate") as string;
  if (!startDateStr) return;

  // Build the Shift Matrix dynamically based on the toggles from the UI!
  const includeS1 = formData.get("includeS1") === "true";
  const includeS1Special = formData.get("includeS1Special") === "true" || formData.get("includeSpecialMorning") === "true";
  const includeS2 = formData.get("includeS2") === "true";
  const includeS3 = formData.get("includeS3") === "true";

  const SHIFT_MATRIX = [];
  if (includeS1) {
    SHIFT_MATRIX.push(
      { type: "FULL_MORNING", role: "CASHIER" as const, pay: 60000 }, 
      { type: "PART_MORNING", role: "KITCHEN" as const, pay: 40000 }
    );
    if (includeS1Special) {
      // Special Morning Rush Shift: 10:00 - 13:00 (3 hours @ 6,000 IDR/hour = 18,000 IDR)
      SHIFT_MATRIX.push(
        { type: "SPECIAL_MORNING", role: "KITCHEN" as const, pay: 18000 }
      );
    }
  }
  if (includeS2) {
    SHIFT_MATRIX.push(
      { type: "FULL_EVENING", role: "CASHIER" as const, pay: 60000 }, 
      { type: "PART_EVENING", role: "KITCHEN" as const, pay: 40000 }
    );
  }
  if (includeS3) {
    SHIFT_MATRIX.push(
      { type: "MIDNIGHT", role: "CASHIER" as const, pay: 60000 }
    );
  }

  if (SHIFT_MATRIX.length === 0) {
    throw new Error("You must enable at least one shift type (S1, S2, or S3) to roll the engine.");
  }

  // 1. Fetch available workers for this specific branch (EXCLUDING Managers & Super Admins)
  const branchStaff = await db.select().from(users).where(
    and(
      eq(users.restaurantId, restaurantId),
      eq(users.role, "WORKER")
    )
  );

  // Partition workers into Regulars vs "Shift Timer" hourly workers
  const isShiftTimer = (u: any) => 
    u.staffType === "SHIFT_TIMER" || 
    (u.name && /shift\s*timer|timer/i.test(u.name));

  const regularStaff = branchStaff.filter(u => !isShiftTimer(u));
  const timerStaff = branchStaff.filter(u => isShiftTimer(u));
  
  const mode = formData.get("mode") as string || "WEEKLY";
  
  const startDate = new Date(startDateStr);
  const newShifts = [];
  
  const totalDays = mode === "MONTHLY" ? 28 : 7; // 4 weeks exactly for perfect monthly rosters

  // Track how many shifts each worker gets this week (Max 5 for regular, 6 for timer)
  const workerShiftCounts: Record<string, number> = {};
  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    const dateStr = currentDate.toISOString().split("T")[0];

    // Reset weekly shift limits every 7 days!
    if (dayOffset % 7 === 0) {
      branchStaff.forEach(w => workerShiftCounts[w.id] = 0);
    }

    // FAIRNESS ALGORITHM UPGRADE:
    // Sort separately for Regular and Shift Timer pools based on shifts worked this week
    let availableRegulars = [...regularStaff].sort((a, b) => {
      const countDiff = workerShiftCounts[a.id] - workerShiftCounts[b.id];
      if (countDiff !== 0) return countDiff;
      return Math.random() - 0.5; // Tie-breaker Gacha
    });

    let availableTimers = [...timerStaff].sort((a, b) => {
      const countDiff = workerShiftCounts[a.id] - workerShiftCounts[b.id];
      if (countDiff !== 0) return countDiff;
      return Math.random() - 0.5; // Tie-breaker Gacha
    });

    for (const slot of SHIFT_MATRIX) {
      let selectedWorker = null;
      
      if (slot.type === "SPECIAL_MORNING") {
        // Special hourly rush shift (10:00 - 13:00): ONLY fill from "Shift Timer" pool!
        for (let i = 0; i < availableTimers.length; i++) {
          const w = availableTimers[i];
          if (workerShiftCounts[w.id] < 6) {
            selectedWorker = w;
            workerShiftCounts[w.id]++;
            availableTimers.splice(i, 1);
            break;
          }
        }
      } else {
        // Standard full & part shifts: ONLY fill from Regular pool!
        for (let i = 0; i < availableRegulars.length; i++) {
          const w = availableRegulars[i];
          if (workerShiftCounts[w.id] < 5) {
            selectedWorker = w;
            workerShiftCounts[w.id]++;
            availableRegulars.splice(i, 1);
            break;
          }
        }
      }

      newShifts.push({
        restaurantId,
        userId: selectedWorker ? selectedWorker.id : null, // If no shift timer available, OPEN SHIFT
        date: dateStr,
        shiftType: slot.type,
        assignedRole: slot.role,
        expectedPay: slot.pay,
        status: "SCHEDULED" as const
      });
    }
  }

  // 2. DELETE the old shifts for this specific period so we don't duplicate them!
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (totalDays - 1));
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

export async function updateShiftRole(shiftId: string, role: "CASHIER" | "KITCHEN" | "SERVICE") {
  if (!shiftId) return;
  await db.update(shifts).set({ assignedRole: role }).where(eq(shifts.id, shiftId));
  revalidatePath("/", "layout");
}

export async function updateWorkerStaffType(userId: string, staffType: "REGULAR" | "SHIFT_TIMER") {
  if (!userId) return;
  await db.update(users).set({ staffType }).where(eq(users.id, userId));
  revalidatePath("/", "layout");
}


