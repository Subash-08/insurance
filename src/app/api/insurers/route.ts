import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Insurer from "@/models/Insurer";
import { logAudit } from "@/lib/insurance";
import cloudinary from "@/lib/cloudinary";

// ─── GET /api/insurers ───────────────────────────────────────────────────────
// Auth: any logged-in user (agents need this for policy dropdowns)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const typeFilter = searchParams.get("type");
  const includeInactive = searchParams.get("includeInactive") === "true";

  // Only owners may request inactive insurers
  const userRole = (session.user as any).role;
  const query: Record<string, unknown> = {};

  if (!includeInactive || userRole !== "owner") {
    query.isActive = true;
  }
  if (typeFilter) {
    query.type = typeFilter;
  }

  await dbConnect();

  const insurers = await Insurer.find(query)
    .select("-logoPublicId -createdBy") // never expose these to clients
    .sort({ name: 1 })
    .lean();

  // Filter plans to active-only in response
  const result = insurers.map((ins) => ({
    ...ins,
    plans: (ins.plans as any[]).filter((p: any) => p.isActive),
  }));

  return NextResponse.json({ success: true, data: result });
}

// ─── POST /api/insurers ──────────────────────────────────────────────────────
// Auth: owner only
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;
  if (user.role !== "owner") {
    return NextResponse.json({ success: false, message: "Forbidden — owner only" }, { status: 403 });
  }

  const body = await req.json();
  const { name, type, email, phone, claimHelpline, website, logoUrl, logoPublicId } = body;

  if (!name || !type) {
    return NextResponse.json(
      { success: false, message: "Name and type are required" },
      { status: 400 }
    );
  }

  await dbConnect();

  // Case-insensitive duplicate name check
  const existing = await Insurer.findOne({
    name: { $regex: `^${name.trim()}$`, $options: "i" },
    isActive: true,
  }).lean();

  if (existing) {
    return NextResponse.json(
      { success: false, message: "Insurer already exists", field: "name" },
      { status: 409 }
    );
  }

  const insurer = await Insurer.create({
    name: name.trim(),
    type,
    email,
    phone,
    claimHelpline,
    website,
    logoUrl,
    logoPublicId,
    createdBy: user.id,
  });

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "CREATE",
    entity: "Insurer",
    entityId: insurer._id.toString(),
    details: `Created insurer: ${insurer.name}`,
  });

  return NextResponse.json({ success: true, data: insurer }, { status: 201 });
}
