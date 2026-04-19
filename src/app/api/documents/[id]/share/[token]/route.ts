import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Document from "@/models/Document";
import { checkOwnership } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();
  const { id, token } = ctx.params;

  if (req.method === "DELETE") {
    // Revoke a specific share token
    const doc = await Document.findOne({ _id: id, isActive: true });
    if (!doc) throw new Error("Document not found");
    if (!checkOwnership(doc, session)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const shareLink = doc.shareLinks.find((sl: any) => sl.token === token);
    if (!shareLink) {
      return NextResponse.json({ success: false, message: "Share link not found" }, { status: 404 });
    }

    shareLink.isRevoked = true;
    await doc.save();

    return NextResponse.json({ success: true, message: "Share link revoked" });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const DELETE = withApiHandler(handler, true);
