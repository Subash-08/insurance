import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Claim from "@/models/Claim";
import AuditLog from "@/models/AuditLog";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const { documentId, received, fileUrl, notes } = await req.json();

    const claim: any = await Claim.findById(params.id);
    if (!claim) return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });

    if (session.user.role !== "owner" && claim.agentId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // ── Update via document _id — NOT by array index ──────────────────────────
    const updateFields: Record<string, any> = {};
    if (received !== undefined) {
      updateFields["documents.$[doc].received"] = received;
      if (received) updateFields["documents.$[doc].receivedAt"] = new Date();
    }
    if (fileUrl !== undefined) updateFields["documents.$[doc].fileUrl"] = fileUrl;
    if (notes !== undefined) updateFields["documents.$[doc].notes"] = notes;

    const updated: any = await Claim.findByIdAndUpdate(
      params.id,
      { $set: updateFields },
      {
        arrayFilters: [{ "doc._id": documentId }],
        new: true,
      }
    );

    await AuditLog.create({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Claim",
      details: `Document ${documentId} updated on claim ${claim.claimNumber}`,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ success: true, documents: updated?.documents });
  } catch (err: any) {
    console.error("[CLAIM_DOCUMENTS]", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
