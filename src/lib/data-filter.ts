import { Session } from "next-auth";
import mongoose from "mongoose";

/**
 * Central data filter helper.
 * Owner sees all records in their agency.
 * Employee sees only their own records.
 * Always filters isActive: true to enforce soft-delete.
 */
export function buildDataFilter(
  session: Session & { user: { id: string; role: string; agencyId?: string } }
): Record<string, unknown> {
  const base = { isActive: true };

  if (!session?.user) return base;

  if (session.user.role === "owner") {
    return session.user.agencyId
      ? { ...base, agencyId: new mongoose.Types.ObjectId(session.user.agencyId) }
      : base;
  }

  // employee — strictly scoped to their own agentId
  return {
    ...base,
    agentId: new mongoose.Types.ObjectId(session.user.id),
    ...(session.user.agencyId
      ? { agencyId: new mongoose.Types.ObjectId(session.user.agencyId) }
      : {}),
  };
}

/**
 * Ownership check — verifies a document belongs to the requesting user.
 * Returns false if employee tries to access another employee's record.
 */
export function checkOwnership(
  doc: { agentId?: mongoose.Types.ObjectId | string },
  session: Session & { user: { id: string; role: string } }
): boolean {
  if (session.user.role === "owner") return true;
  return doc.agentId?.toString() === session.user.id;
}
