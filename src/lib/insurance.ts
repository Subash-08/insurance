import { addMonths, addYears, isBefore, isAfter } from "date-fns";

// MONEY HELPERS
// All monetary values stored in PAISE. Use these for all conversions.

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function formatPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatPaiseCompact(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 10_000_000) {
    return `₹${(rupees / 10_000_000).toFixed(2)} Cr`;
  }
  if (rupees >= 100_000) {
    return `₹${(rupees / 100_000).toFixed(2)} L`;
  }
  return formatPaise(paise);
}

// PREMIUM SCHEDULE GENERATION
// Uses date-fns for correct month arithmetic (handles Feb 29, etc.)
// Returns array of due dates from startDate until maturityDate/expiryDate
// Capped at 360 records to prevent runaway generation

export type PremiumFrequency = "monthly" | "quarterly" | "half-yearly" | "yearly" | "single";

export interface PremiumScheduleEntry {
  dueDate: Date;
  amount: number; // in PAISE
  status: "upcoming" | "due";
  gracePeriodDays: number;
}

export function generatePremiumSchedule(
  startDate: Date,
  endDate: Date,       // maturityDate or expiryDate
  frequency: PremiumFrequency,
  totalPremiumPaise: number,
  gracePeriodDays: number
): PremiumScheduleEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (frequency === "single") {
    const graceDeadline = new Date(startDate);
    graceDeadline.setDate(graceDeadline.getDate() + gracePeriodDays);
    return [
      {
        dueDate: new Date(startDate),
        amount: totalPremiumPaise,
        status: isBefore(graceDeadline, today) ? "due" : "upcoming",
        gracePeriodDays,
      },
    ];
  }

  const schedule: PremiumScheduleEntry[] = [];
  let current = new Date(startDate);
  const limit = 360; // safety cap

  while (!isAfter(current, endDate) && schedule.length < limit) {
    const graceDeadline = new Date(current);
    graceDeadline.setDate(graceDeadline.getDate() + gracePeriodDays);
    const status = isBefore(current, today) ? "due" : "upcoming";

    schedule.push({
      dueDate: new Date(current),
      amount: totalPremiumPaise,
      status,
      gracePeriodDays,
    });

    // Advance date by frequency
    switch (frequency) {
      case "monthly":
        current = addMonths(current, 1);
        break;
      case "quarterly":
        current = addMonths(current, 3);
        break;
      case "half-yearly":
        current = addMonths(current, 6);
        break;
      case "yearly":
        current = addYears(current, 1);
        break;
    }
  }

  return schedule;
}

// HEALTH SCORE COMPUTATION
// Grace-period-aware: overdue = today > dueDate + gracePeriodDays
// GREEN = 0 overdue premiums
// AMBER = exactly 1 overdue premium
// RED   = 2+ overdue OR any premium overdue by > 30 extra days (severe lapse)

export type HealthScore = "green" | "amber" | "red";

export function computeHealthScore(overdueCount: number, maxOverdueDays: number): HealthScore {
  if (overdueCount === 0) return "green";
  if (overdueCount === 1 && maxOverdueDays <= 30) return "amber";
  return "red";
}

// AUDIT LOG HELPER (fire-and-forget)
export async function logAudit(params: {
  userId: string;
  userRole: "owner" | "employee";
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "STATUS_CHANGE";
  entity: "Insurer" | "Client" | "Policy" | "Premium" | "Claim" | "Lead" | "User" | "Auth";
  entityId?: string;
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  details?: string;
}): Promise<void> {
  // Fire and forget — never await this, never let it break the main operation
  try {
    const AuditLog = (await import("@/models/AuditLog")).default;
    await AuditLog.create({
      userId: params.userId,
      userRole: params.userRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      changes: params.changes,
      details: params.details,
      timestamp: new Date(),
    });
  } catch {
    // Intentionally silent — audit failure must never break business logic
    console.error("[Audit] Failed to write audit log:", params.action, params.entity);
  }
}

// POLICY STATE MACHINE GUARD
// Returns true if transition is valid
export function isPolicyTransitionValid(current: string, next: string): boolean {
  const POLICY_TRANSITIONS: Record<string, string[]> = {
    active: ["lapsed", "surrendered", "matured"],
    lapsed: ["active"],
    surrendered: [],
    matured: [],
    claimed: [],
    cancelled: [],
  };
  return (POLICY_TRANSITIONS[current] ?? []).includes(next);
}

// GST CALCULATION
// Standard insurance GST: 18%
export function computeGST(premiumPaise: number): number {
  return Math.round(premiumPaise * 0.18);
}

// GRACE PERIOD DEFAULTS by policy type
export function getDefaultGracePeriod(type: string): number {
  return ["health", "vehicle", "fire", "travel"].includes(type) ? 15 : 30;
}
