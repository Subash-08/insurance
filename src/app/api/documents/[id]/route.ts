import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Document from "@/models/Document";
import cloudinary from "@/lib/cloudinary";
import { checkOwnership } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();
  const { id } = ctx.params;

  if (req.method === "DELETE") {
    const doc = await Document.findOne({ _id: id, isActive: true });
    if (!doc) throw new Error("Document not found");
    if (!checkOwnership(doc, session)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    // Delete from cloudinary
    if (doc.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(doc.cloudinaryPublicId);
      } catch (err) {
        console.error("Failed to delete from Cloudinary:", err);
      }
    }

    doc.isActive = false;
    doc.deletedAt = new Date();
    await doc.save();

    return NextResponse.json({ success: true, message: "Document deleted" });
  }

  if (req.method === "PUT") {
    const body = await req.json();
    const doc = await Document.findOne({ _id: id, isActive: true });
    if (!doc) throw new Error("Document not found");
    if (!checkOwnership(doc, session)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    if (body.documentType) doc.documentType = body.documentType;
    if (body.expiryDate !== undefined) doc.expiryDate = body.expiryDate;
    if (body.status) doc.status = body.status;

    await doc.save();
    return NextResponse.json({ success: true, data: doc });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const DELETE = withApiHandler(handler, true);
export const PUT = withApiHandler(handler, true);
