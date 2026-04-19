import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Document from "@/models/Document";
import { buildDataFilter } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();

  if (req.method === "GET") {
    const filter = buildDataFilter(session);
    
    // Default 30 days
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const today = new Date();
    
    // We only care about active documents that expire soon or have recently expired but are not explicitly archived
    const docs = await Document.find({
      ...filter,
      status: "active",
      expiryDate: { $lte: nextMonth, $exists: true, $ne: null }
    }).sort({ expiryDate: 1 }).lean();

    return NextResponse.json({
      success: true,
      data: docs
    });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const GET = withApiHandler(handler, true);
