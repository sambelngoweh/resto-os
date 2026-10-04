"use server";

import { db } from "@/db";
import { qrSessions, shifts, users, restaurants, branchDevices } from "@/db/schema";
import { eq, and, desc, or, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import crypto from "crypto";

// 1. Terminal / Screen creates a new QR session
export async function createQrSession(
  action: "ATTENDANCE" | "POS_LOGIN" | "SWITCH_CASHIER",
  branchId?: string
) {
  const sessionId = crypto.randomUUID();
  const secretToken = crypto.randomBytes(24).toString("hex");
  // 6-digit backup code (e.g. "839-214")
  const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
  const shortCode = `${rawCode.slice(0, 3)}-${rawCode.slice(3)}`;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes validity

  const { validateDeviceAuth } = await import("@/lib/deviceAuth");
  const deviceCheck = await validateDeviceAuth();

  if (!deviceCheck.isAuthorized) {
    return {
      error: "UNAUTHORIZED_DEVICE",
      message: deviceCheck.reason === "DEVICE_REVOKED"
        ? "Access Revoked: This terminal was remotely terminated by Super Admin. Attendance and POS QR codes are blocked."
        : "Unauthorized Device: This device has not been authorized by Super Admin/Manager. Attendance and POS QR codes are blocked to prevent remote fraud.",
      sessionId: null,
      secretToken: null,
      shortCode: null,
      action,
      branchId: null,
      expiresAt: null,
    };
  }

  // Auto-resolve branch if branchId not provided (use first active branch as fallback for kiosk)
  let targetBranchId = branchId || null;
  if (!targetBranchId) {
    const firstBranch = await db.query.restaurants.findFirst();
    if (firstBranch) targetBranchId = firstBranch.id;
  }

  await db.insert(qrSessions).values({
    id: sessionId,
    restaurantId: targetBranchId,
    action,
    status: "PENDING",
    secretToken,
    shortCode,
    expiresAt,
  });

  return {
    sessionId,
    secretToken,
    shortCode,
    action,
    branchId: targetBranchId,
    expiresAt: expiresAt.toISOString(),
  };
}

// 2. Terminal polls status of its QR session
export async function pollQrSession(sessionId: string, secretToken: string) {
  if (!sessionId || !secretToken) return { status: "INVALID" };

  const session = await db.query.qrSessions.findFirst({
    where: and(
      eq(qrSessions.id, sessionId),
      eq(qrSessions.secretToken, secretToken)
    )
  });

  if (!session) return { status: "EXPIRED" };
  if (session.expiresAt < new Date()) {
    if (session.status === "PENDING") {
      await db.update(qrSessions).set({ status: "EXPIRED" }).where(eq(qrSessions.id, sessionId));
    }
    return { status: "EXPIRED" };
  }

  return {
    status: session.status,
    userId: session.userId,
    userName: session.userName,
    userRole: session.userRole,
    attendanceType: session.attendanceType,
    clockTime: session.clockTime,
    action: session.action,
    restaurantId: session.restaurantId,
  };
}

// 3. Look up session by 6-digit shortCode or sessionId (for phone scanner)
export async function getQrSessionDetails(codeOrId: string) {
  const cleanCode = codeOrId.trim();
  const session = await db.query.qrSessions.findFirst({
    where: or(
      eq(qrSessions.id, cleanCode),
      eq(qrSessions.shortCode, cleanCode)
    )
  });

  if (!session) return { success: false, error: "QR Session not found" };
  if (session.expiresAt < new Date() || session.status === "EXPIRED" || session.status === "CONSUMED") {
    return { success: false, error: "This QR Code has expired. Please refresh the terminal." };
  }
  if (session.status === "APPROVED") {
    return { success: false, error: "This QR Code was already approved." };
  }

  let branchName = "Main Branch";
  if (session.restaurantId) {
    const branch = await db.query.restaurants.findFirst({
      where: eq(restaurants.id, session.restaurantId)
    });
    if (branch) branchName = branch.name;
  }

  const authSession = await auth();
  // @ts-ignore
  const currentUserId = authSession?.user?.id;
  // @ts-ignore
  const currentUserRole = authSession?.user?.role;

  let cashierEligibility = {
    isEligible: true,
    reason: ""
  };

  const isPosAction = session.action === "POS_LOGIN" || session.action === "SWITCH_CASHIER";

  if (isPosAction && currentUserId && currentUserRole === "WORKER" && session.restaurantId) {
    const today = new Date().toISOString().split("T")[0];
    const todayShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.userId, currentUserId),
        eq(shifts.restaurantId, session.restaurantId),
        eq(shifts.date, today)
      )
    });

    const isScheduledCashier = todayShift && (
      todayShift.assignedRole
        ? todayShift.assignedRole === "CASHIER"
        : (todayShift.shiftType.includes("FULL") || todayShift.shiftType === "MIDNIGHT")
    );

    if (!isScheduledCashier) {
      cashierEligibility = {
        isEligible: false,
        reason: todayShift
          ? `You are assigned as [${todayShift.assignedRole || "Kitchen / Support"}] on today's schedule, not Cashier.`
          : `You are not scheduled for a shift today (${today}).`
      };
    }
  }

  return {
    success: true,
    sessionId: session.id,
    shortCode: session.shortCode,
    action: session.action,
    restaurantId: session.restaurantId,
    branchName,
    expiresAt: session.expiresAt.toISOString(),
    cashierEligibility,
  };
}

// 4. Staff approves from phone (Records Attendance & Authorizes POS if requested)
export async function approveQrSessionFromPhone(
  sessionId: string,
  options?: { attendanceType?: "CLOCK_IN" | "CLOCK_OUT" }
) {
  const authSession = await auth();
  // @ts-ignore
  const userId = authSession?.user?.id;
  const userName = authSession?.user?.name || "Staff";
  // @ts-ignore
  const userRole = authSession?.user?.role || "WORKER";
  // @ts-ignore
  const userRestaurantId = authSession?.user?.restaurantId;

  if (!userId) {
    return { success: false, error: "You must be signed into Resto OS on your phone." };
  }

  const qSession = await db.query.qrSessions.findFirst({
    where: eq(qrSessions.id, sessionId)
  });

  if (!qSession || qSession.expiresAt < new Date()) {
    return { success: false, error: "Session expired or invalid." };
  }

  const effectiveBranchId = qSession.restaurantId || userRestaurantId;
  const today = new Date().toISOString().split("T")[0];
  const nowFormatted = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const isPosLoginAction = qSession.action === "POS_LOGIN" || qSession.action === "SWITCH_CASHIER";

  // DYNAMIC GACHA SCHEDULE ROLE FIREWALL
  // Workers without Cashier assignment for today cannot unlock or switch into the POS!
  if (isPosLoginAction && userRole === "WORKER" && effectiveBranchId) {
    const todayShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.userId, userId),
        eq(shifts.restaurantId, effectiveBranchId),
        eq(shifts.date, today)
      )
    });

    const isAssignedCashier = todayShift && (
      todayShift.assignedRole
        ? todayShift.assignedRole === "CASHIER"
        : (todayShift.shiftType.includes("FULL") || todayShift.shiftType === "MIDNIGHT")
    );

    if (!isAssignedCashier) {
      const roleName = todayShift?.assignedRole || "Kitchen / Prep";
      return {
        success: false,
        error: todayShift
          ? `❌ Access Restricted: You are scheduled as [${roleName}] today, not Cashier. Only staff assigned to Cashier on today's schedule can operate the POS. Please use Quick Attendance to check in.`
          : `❌ Access Restricted: You have no scheduled shift for today (${today}). You cannot unlock the POS register. Please use Quick Attendance.`
      };
    }
  }

  let attendanceType: "CLOCK_IN" | "CLOCK_OUT" = options?.attendanceType || "CLOCK_IN";

  // Check today's shift for this user
  if (effectiveBranchId) {
    const existingShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.userId, userId),
        eq(shifts.restaurantId, effectiveBranchId),
        eq(shifts.date, today)
      )
    });

    if (existingShift) {
      if (!existingShift.clockInTime) {
        // Clock In
        attendanceType = "CLOCK_IN";
        await db.update(shifts).set({
          clockInTime: new Date().toISOString(),
          status: "COMPLETED",
        }).where(eq(shifts.id, existingShift.id));
      } else if (!existingShift.clockOutTime) {
        // Shift already clocked in; if user wants to clock out:
        if (options?.attendanceType === "CLOCK_OUT") {
          attendanceType = "CLOCK_OUT";
          await db.update(shifts).set({
            clockOutTime: new Date().toISOString(),
          }).where(eq(shifts.id, existingShift.id));
        } else {
          // Already clocked in, keeping clock in timestamp
          attendanceType = "CLOCK_IN";
        }
      }
    } else {
      // Auto-create a shift record if none was scheduled so worker attendance is never lost!
      await db.insert(shifts).values({
        restaurantId: effectiveBranchId,
        userId,
        date: today,
        shiftType: "MORNING",
        expectedPay: 50000,
        status: "COMPLETED",
        clockInTime: new Date().toISOString(),
      });
      attendanceType = "CLOCK_IN";
    }
  }

  // Update QR session to APPROVED
  await db.update(qrSessions).set({
    status: "APPROVED",
    userId,
    userName,
    userRole,
    attendanceType,
    clockTime: nowFormatted,
  }).where(eq(qrSessions.id, sessionId));

  return {
    success: true,
    staffName: userName,
    role: userRole,
    attendanceType,
    clockTime: nowFormatted,
    action: qSession.action,
  };
}

// 5. Super Admin QR Activity & Attendance Audit Trail
export async function fetchBranchQrLogs(branchId: string, limit = 15) {
  if (!branchId) return [];
  return await db.query.qrSessions.findMany({
    where: and(
      eq(qrSessions.restaurantId, branchId),
      inArray(qrSessions.status, ["APPROVED", "CONSUMED"])
    ),
    orderBy: [desc(qrSessions.createdAt)],
    limit,
  });
}
