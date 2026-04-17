import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Claim from "@/models/Claim";
import AuditLog from "@/models/AuditLog";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const { appealReason, notes, appealDocuments = [] } = await req.json();

    if (!appealReason || appealReason.length < 50) {
      return NextResponse.json({ success: false, error: "Appeal reason must be at least 50 characters." }, { status: 400 });
    }

    const claim: any = await Claim.findById(params.id);
    if (!claim) return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });

    if (session.user.role !== "owner" && claim.agentId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (claim.status !== "rejected") {
      return NextResponse.json({ success: false, error: "Appeals can only be filed on rejected claims." }, { status: 400 });
    }

    const newAppeal = {
      appealDate: new Date(),
      appealReason,
      appealStatus: "filed",
      filedBy: session.user.id,
      appealDocuments,
      notes,
    };

    // Append appeal + reset status to filed atomically
    await Claim.findByIdAndUpdate(params.id, {
      $push: {
        appeals: newAppeal,
        statusHistory: {
          status: "filed",
          changedBy: session.user.id,
          changedAt: new Date(),
          notes: `Appeal filed: ${appealReason.slice(0, 100)}`,
        },
      },
      $set: { status: "filed" }, // Re-open claim flow
    });

    await AuditLog.create({
      userId: session.user.id,
      action: "Updated",
      module: "Claim",
      details: `Appeal filed on claim ${claim.claimNumber}`,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[CLAIM_APPEAL]", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
