import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: { id?: string, type?: string } }) {
  try {
    return NextResponse.json({ success: true, message: "GET endpoint for n8n/get-due-reminders/route.ts" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

