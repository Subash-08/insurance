import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildWhatsAppUrl, sendWhatsAppApiMessage, WHATSAPP_MODE } from "@/lib/whatsapp";
import dbConnect from "@/lib/mongodb";
import ReminderLog from "@/models/ReminderLog";
import AuditLog from "@/models/AuditLog";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { phone, templateKey, variables, clientId, policyId } = await req.json();
  if (!phone || !templateKey) {
    return NextResponse.json({ success: false, error: "phone and templateKey are required" }, { status: 400 });
  }

  await dbConnect();

  if (WHATSAPP_MODE === "deep_link") {
    const url = buildWhatsAppUrl(templateKey, variables || {}, phone);

    // Log the deep-link trigger for audit trail
    if (clientId) {
      await ReminderLog.create({
        clientId,
        policyId: policyId || undefined,
        templateSlug: templateKey,
        channel: "whatsapp",
        recipientPhone: phone,
        status: "sent",
        sentAt: new Date(),
        triggeredBy: "manual",
        triggeredByUserId: session.user.id,
      }).catch((e: any) => console.warn("[WhatsApp log]", e.message));
    }

    await AuditLog.create({
      userId: session.user.id,
      action: "CREATE",
      entity: "Reminder",
      details: `WhatsApp deep-link triggered: template=${templateKey}, phone=${phone}`,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ success: true, mode: "deep_link", url });
  }

  // API mode
  const result = await sendWhatsAppApiMessage(phone, templateKey, variables || {});
  return NextResponse.json({ success: result.success, mode: "api", messageId: result.messageId, reason: result.reason });
}
