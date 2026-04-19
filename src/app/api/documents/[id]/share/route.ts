import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Document from "@/models/Document";
import crypto from "crypto";
import { checkOwnership } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();
  const { id } = ctx.params;

  if (req.method === "POST") {
    const doc = await Document.findOne({ _id: id, isActive: true });
    if (!doc) throw new Error("Document not found");
    if (!checkOwnership(doc, session)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const expiresInHours = body.expiresInHours || 24;
    const maxAccessCount = body.maxAccessCount || 2;

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    doc.shareLinks.push({
      token,
      expiresAt,
      maxAccessCount,
      accessCount: 0,
      isRevoked: false,
      createdAt: new Date(),
    });

    await doc.save();

    // The shared link url
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const link = `${baseUrl}/shared/doc/${token}`;

    return NextResponse.json({ success: true, data: { token, link, expiresAt } }, { status: 201 });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const POST = withApiHandler(handler, true);
