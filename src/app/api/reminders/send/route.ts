import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ReminderLog from "@/models/ReminderLog";
import AuditLog from "@/models/AuditLog";
import { triggerManualReminder, isN8nConfigured } from "@/lib/n8n";
import { buildVariablePayload } from "@/lib/template-engine";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const { clientId, policyId, premiumId, templateSlug, channel = "email", recipientPhone, recipientEmail } = await req.json();
    if (!clientId || !templateSlug) {
      return NextResponse.json({ success: false, error: "clientId and templateSlug required" }, { status: 400 });
    }

    const n8nReady = await isN8nConfigured();

    let logStatus = "pending";
    let n8nExecutionId: string | undefined;

    if (n8nReady && policyId) {
      const result = await triggerManualReminder(clientId, policyId, templateSlug);
      logStatus = result.success ? "sent" : "failed";
    }

    const log = await ReminderLog.create({
      clientId,
      policyId: policyId || undefined,
      premiumId: premiumId || undefined,
      templateSlug,
      channel,
      recipientPhone,
      recipientEmail,
      status: logStatus,
      sentAt: new Date(),
      triggeredBy: "manual",
      triggeredByUserId: session.user.id,
      n8nExecutionId,
    });

    await AuditLog.create({
      userId: session.user.id,
      action: "Created",
      module: "Reminder",
      details: `Manual reminder sent: template=${templateSlug}, channel=${channel}`,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ success: true, logId: log._id, n8nTriggered: n8nReady });
  } catch (err: any) {
    console.error("[REMINDERS_SEND]", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
