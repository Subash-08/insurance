import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ReminderLog from "@/models/ReminderLog";
import Client from "@/models/Client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const filter: any = {};
    if (session.user.role !== "owner") {
      // Employees: only see reminders they triggered
      filter.triggeredByUserId = session.user.id;
    }

    const [data, total] = await Promise.all([
      ReminderLog.find(filter)
        .sort({ sentAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "clientId", model: Client, select: "fullName mobile" })
        .lean(),
      ReminderLog.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, data, pagination: { total, page, limit } });
  } catch (err: any) {
    console.error("[REMINDERS_GET]", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
