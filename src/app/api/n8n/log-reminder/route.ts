import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { N8N_WEBHOOK_SECRET } from "@/lib/n8n";
import dbConnect from "@/lib/mongodb";
import ReminderLog from "@/models/ReminderLog";

const logSchema = z.object({
  clientId: z.string().min(1),
  policyId: z.string().optional(),
  premiumId: z.string().optional(),
  templateSlug: z.string().min(1),
  channel: z.enum(["email", "sms", "whatsapp"]),
  status: z.enum(["pending", "sent", "delivered", "opened", "clicked", "failed", "bounced", "opted_out"]),
  sentAt: z.string(),
  n8nExecutionId: z.string().optional(),
  recipientEmail: z.string().optional(),
  recipientPhone: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  failureReason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  if (!process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }
  const header = req.headers.get("x-insureflow-secret");
  if (!header || header !== N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const parsed = logSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;
    const log = await ReminderLog.create({
      clientId: data.clientId,
      policyId: data.policyId || undefined,
      premiumId: data.premiumId || undefined,
      templateSlug: data.templateSlug,
      channel: data.channel,
      status: data.status,
      sentAt: new Date(data.sentAt),
      n8nExecutionId: data.n8nExecutionId,
      recipientEmail: data.recipientEmail,
      recipientPhone: data.recipientPhone,
      subject: data.subject,
      body: data.body,
      failureReason: data.failureReason,
      triggeredBy: "n8n_callback",
    });

    return NextResponse.json({ success: true, logId: log._id });
  } catch (err: any) {
    console.error("[N8N_LOG_REMINDER]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
