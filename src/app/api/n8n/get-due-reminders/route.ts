import { NextRequest, NextResponse } from "next/server";
import { N8N_WEBHOOK_SECRET } from "@/lib/n8n";
import dbConnect from "@/lib/mongodb";
import ReminderSettings from "@/models/ReminderSettings";
import {
  getDueRenewals,
  getDuePremiums,
  getOverduePremiums,
  getBirthdays,
  getMaturities,
} from "@/lib/reminder-scheduler";

function validateSecret(req: NextRequest): boolean {
  if (!process.env.N8N_WEBHOOK_SECRET) return false;
  const header = req.headers.get("x-insureflow-secret");
  return header === N8N_WEBHOOK_SECRET;
}

export async function GET(req: NextRequest) {
  if (!process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured on server" }, { status: 503 });
  }
  if (!validateSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const days = parseInt(searchParams.get("days") || "7");
    const agentId = searchParams.get("agentId");

    const settings: any = await ReminderSettings.findOne({}).lean();

    if (settings) {
      // Active hours check (IST)
      const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const currentHour = nowIST.getHours();
      const { activeHoursStart = 9, activeHoursEnd = 18, workingDays = [1,2,3,4,5,6] } = settings;

      if (currentHour < activeHoursStart || currentHour >= activeHoursEnd) {
        return NextResponse.json({ reminders: [], count: 0, reason: "outside_active_hours" });
      }

      const dayOfWeek = nowIST.getDay();
      if (!workingDays.includes(dayOfWeek)) {
        return NextResponse.json({ reminders: [], count: 0, reason: "non_working_day" });
      }
    }

    const dataFilter: any = {};
    if (agentId) dataFilter.agentId = agentId;

    let reminders: any[] = [];

    switch (type) {
      case "renewal":        reminders = await getDueRenewals(days, dataFilter); break;
      case "premium_due":    reminders = await getDuePremiums(days, dataFilter); break;
      case "premium_overdue": reminders = await getOverduePremiums(days, dataFilter); break;
      case "birthday":       reminders = await getBirthdays(dataFilter); break;
      case "maturity":       reminders = await getMaturities(days, dataFilter); break;
      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    return NextResponse.json({
      reminders,
      count: reminders.length,
      generatedAt: new Date().toISOString(),
      type,
      days,
    });
  } catch (err: any) {
    console.error("[N8N_GET_DUE_REMINDERS]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
