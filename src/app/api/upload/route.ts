import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, context: { params: { id?: string, type?: string } }) {
  try {
    return NextResponse.json({ success: true, message: "POST endpoint for upload/route.ts" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

