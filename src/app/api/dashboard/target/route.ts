import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import ReminderSettings from "@/models/ReminderSettings";

const TargetSchema = z.object({
  monthlyRevenueTarget: z.number().int().min(0), // in paise
});

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (token.role !== "owner") return NextResponse.json({ success: false, error: "Owner only" }, { status: 403 });

  await dbConnect();
  try {
    const settings = await ReminderSettings.findOne().select("monthlyRevenueTarget").lean() as any;
    return NextResponse.json({ success: true, data: { monthlyRevenueTarget: (settings as any)?.monthlyRevenueTarget ?? 0 } });
  } catch (err) {
    console.error("[TARGET_GET]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch target" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (token.role !== "owner") return NextResponse.json({ success: false, error: "Owner only" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 }); }

  const parsed = TargetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });

  await dbConnect();
  try {
    await ReminderSettings.findOneAndUpdate(
      {},
      { $set: { monthlyRevenueTarget: parsed.data.monthlyRevenueTarget } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[TARGET_PATCH]", err);
    return NextResponse.json({ success: false, error: "Failed to update target" }, { status: 500 });
  }
}
