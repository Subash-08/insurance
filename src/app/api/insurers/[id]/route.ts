import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Insurer from "@/models/Insurer";
import Policy from "@/models/Policy";
import cloudinary from "@/lib/cloudinary";
import { logAudit } from "@/lib/insurance";
import mongoose from "mongoose";

type Params = { params: { id: string } };

// ─── PUT /api/insurers/[id] ───────────────────────────────────────────────────
export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;
  if (user.role !== "owner") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
  }

  await dbConnect();
  const insurer = await Insurer.findById(params.id);
  if (!insurer || !insurer.isActive) {
    return NextResponse.json({ success: false, message: "Insurer not found" }, { status: 404 });
  }

  const before = insurer.toObject();
  const body = await req.json();
  const { name, type, email, phone, claimHelpline, website, logoUrl, logoPublicId } = body;

  // If logo is changing, delete old one from Cloudinary
  if (logoPublicId && insurer.logoPublicId && logoPublicId !== insurer.logoPublicId) {
    try {
      await cloudinary.uploader.destroy(insurer.logoPublicId);
    } catch {
      console.error("[Cloudinary] Failed to delete old logo:", insurer.logoPublicId);
    }
  }

  if (name) insurer.name = name.trim();
  if (type) insurer.type = type;
  if (email !== undefined) insurer.email = email;
  if (phone !== undefined) insurer.phone = phone;
  if (claimHelpline !== undefined) insurer.claimHelpline = claimHelpline;
  if (website !== undefined) insurer.website = website;
  if (logoUrl !== undefined) insurer.logoUrl = logoUrl;
  if (logoPublicId !== undefined) insurer.logoPublicId = logoPublicId;

  await insurer.save();

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "UPDATE",
    entity: "Insurer",
    entityId: insurer._id.toString(),
    changes: { before, after: insurer.toObject() },
    details: `Updated insurer: ${insurer.name}`,
  });

  return NextResponse.json({ success: true, data: insurer });
}

// ─── DELETE /api/insurers/[id] ────────────────────────────────────────────────
// Soft delete with active policy check
export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;
  if (user.role !== "owner") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
  }

  await dbConnect();

  // Block if active policies reference this insurer
  const activePolicies = await Policy.countDocuments({
    insurerId: params.id,
    status: "active",
    isActive: true,
  });

  if (activePolicies > 0) {
    return NextResponse.json(
      {
        success: false,
        message: `Cannot deactivate — ${activePolicies} active ${activePolicies === 1 ? "policy references" : "policies reference"} this insurer. Reassign them first.`,
      },
      { status: 400 }
    );
  }

  const insurer = await Insurer.findByIdAndUpdate(
    params.id,
    { isActive: false, deletedAt: new Date() },
    { new: true }
  );

  if (!insurer) {
    return NextResponse.json({ success: false, message: "Insurer not found" }, { status: 404 });
  }

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "DELETE",
    entity: "Insurer",
    entityId: insurer._id.toString(),
    details: `Deactivated insurer: ${insurer.name}`,
  });

  return NextResponse.json({ success: true, message: "Insurer deactivated" });
}
