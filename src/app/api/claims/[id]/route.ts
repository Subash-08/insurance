import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Claim from "@/models/Claim";
import Policy from "@/models/Policy";
import Client from "@/models/Client";
import User from "@/models/User";
import Insurer from "@/models/Insurer";
import AuditLog from "@/models/AuditLog";
import { validateStatusTransition } from "@/lib/claims-helpers";

function canAccessClaim(session: any, claim: any): boolean {
  if (session.user.role === "owner") return true;
  return claim.agentId?.toString() === session.user.id || claim.agentId?._id?.toString() === session.user.id;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const claim: any = await Claim.findById(params.id)
      .populate({ path: "clientId", model: Client })
      .populate({ path: "policyId", model: Policy, populate: { path: "insurerId", model: Insurer } })
      .populate({ path: "agentId", model: User, select: "name email mobile" })
      .populate({ path: "statusHistory.changedBy", model: User, select: "name role" })
      .lean();

    if (!claim) return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });
    if (!canAccessClaim(session, claim)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    // Compute daysPending server-side in IST
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const daysPending = ["closed", "rejected"].includes(claim.status)
      ? null
      : Math.floor((nowIST.getTime() - new Date(claim.createdAt).getTime()) / 86400000);

    return NextResponse.json({ success: true, claim: { ...claim, daysPending } });
  } catch (err: any) {
    console.error("[CLAIM_GET]", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const claim: any = await Claim.findById(params.id);
    if (!claim) return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });
    if (!canAccessClaim(session, claim)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const allowedFields = ["insurerClaimNumber", "hospitalName", "garageName", "doctorName", "description", "rejectionReason"];
    allowedFields.forEach((f) => { if (body[f] !== undefined) claim[f] = body[f]; });

    await claim.save();
    return NextResponse.json({ success: true, claim });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ success: false, error: "Owner access required" }, { status: 403 });
  }

  await dbConnect();

  try {
    // Soft-delete: close with a note
    const claim: any = await Claim.findByIdAndUpdate(params.id, {
      $set: { status: "closed" },
      $push: {
        statusHistory: {
          status: "closed",
          changedBy: session.user.id,
          changedAt: new Date(),
          notes: "Deleted by owner",
        },
      },
    }, { new: true });

    if (!claim) return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });

    await AuditLog.create({
      userId: session.user.id,
      action: "Deleted",
      module: "Claim",
      details: `Owner soft-deleted claim ${claim.claimNumber}`,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
