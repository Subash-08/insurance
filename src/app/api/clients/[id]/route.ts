import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import Policy from "@/models/Policy";
import Premium from "@/models/Premium";
import { logAudit, computeHealthScore } from "@/lib/insurance";
import mongoose from "mongoose";

type Params = { params: { id: string } };

async function getClientHealthScore(clientId: string): Promise<"green" | "amber" | "red"> {
  const today = new Date();
  const unpaid = await Premium.find({
    clientId,
    status: { $nin: ["paid", "cancelled"] },
  })
    .select("dueDate gracePeriodDays")
    .lean();

  let overdueCount = 0;
  let maxOverdueDays = 0;
  for (const rec of unpaid as any[]) {
    const deadline = new Date(rec.dueDate);
    deadline.setDate(deadline.getDate() + (rec.gracePeriodDays ?? 30));
    if (today > deadline) {
      overdueCount++;
      const days = Math.floor((today.getTime() - deadline.getTime()) / 86400000);
      if (days > maxOverdueDays) maxOverdueDays = days;
    }
  }
  return computeHealthScore(overdueCount, maxOverdueDays);
}

// ─── GET /api/clients/[id] ────────────────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
  }

  await dbConnect();
  const client = await Client.findOne({ _id: params.id, isActive: true })
    .populate("agentId", "name email phone")
    .populate("referredBy", "fullName phone")
    .lean() as any;

  if (!client) {
    return NextResponse.json({ success: false, message: "Client not found" }, { status: 404 });
  }

  // Ownership check for employees
  if (user.role === "employee" && client.agentId?._id?.toString() !== user.id) {
    return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
  }

  // Fetch summary counts in parallel
  const [activePoliciesCount, openClaimsCount, healthScore] = await Promise.all([
    Policy.countDocuments({ clientId: params.id, status: "active", isActive: true }),
    mongoose.models.Claim
      ? mongoose.models.Claim.countDocuments({ clientId: params.id, status: { $nin: ["settled", "rejected"] } })
      : Promise.resolve(0),
    getClientHealthScore(params.id),
  ]);

  // Sum assured and total premium paid
  const [sumAssuredAgg, premiumPaidAgg] = await Promise.all([
    Policy.aggregate([
      { $match: { clientId: new mongoose.Types.ObjectId(params.id), status: "active", isActive: true } },
      { $group: { _id: null, total: { $sum: "$sumAssured" } } },
    ]),
    Premium.aggregate([
      { $match: { clientId: new mongoose.Types.ObjectId(params.id), status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      ...client,
      healthScore,
      summary: {
        activePoliciesCount,
        openClaimsCount,
        totalSumAssured: sumAssuredAgg[0]?.total || 0, // in paise
        totalPremiumPaid: premiumPaidAgg[0]?.total || 0, // in paise
      },
    },
  });
}

// ─── PUT /api/clients/[id] ────────────────────────────────────────────────────
export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
  }

  await dbConnect();
  const client = await Client.findOne({ _id: params.id, isActive: true });
  if (!client) {
    return NextResponse.json({ success: false, message: "Client not found" }, { status: 404 });
  }

  if (user.role === "employee" && client.agentId.toString() !== user.id) {
    return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
  }

  const before = client.toObject();
  const body = await req.json();

  // Blocked fields
  delete body._id;
  delete body.agentId;  // employees cannot change agentId
  delete body.agencyId;
  delete body.notes;    // notes have their own endpoint
  delete body.createdAt;

  // Employees cannot reassign records
  if (user.role === "employee") {
    delete body.agentId;
  }

  if (body.panNumber) body.panNumber = body.panNumber.toUpperCase().trim();

  const nominees = body.nominees;
  if (nominees && nominees.length > 0) {
    const totalShare = nominees.reduce((sum: number, n: any) => sum + (n.share || 0), 0);
    if (Math.abs(totalShare - 100) > 0.01) {
      return NextResponse.json(
        { success: false, message: "Nominee shares must sum to 100%", field: "nominees" },
        { status: 400 }
      );
    }
    body.nominees = nominees.map((n: any) => ({
      ...n,
      isMinor: n.dob
        ? (new Date().getTime() - new Date(n.dob).getTime()) / (365.25 * 24 * 3600 * 1000) < 18
        : false,
    }));
  }

  Object.assign(client, body);

  try {
    await client.save();
  } catch (err: any) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "";
      return NextResponse.json(
        { success: false, message: `Duplicate value for ${field}`, field },
        { status: 409 }
      );
    }
    throw err;
  }

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "UPDATE",
    entity: "Client",
    entityId: client._id.toString(),
    changes: { before, after: client.toObject() },
    details: `Updated client: ${client.fullName}`,
  });

  return NextResponse.json({ success: true, data: client });
}

// ─── DELETE /api/clients/[id] ─────────────────────────────────────────────────
// Owner only — soft delete with active policy check
export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;
  if (user.role !== "owner") {
    return NextResponse.json({ success: false, message: "Forbidden — owner only" }, { status: 403 });
  }

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
  }

  await dbConnect();

  const activePolicies = await Policy.countDocuments({
    clientId: params.id,
    status: "active",
    isActive: true,
  });

  if (activePolicies > 0) {
    return NextResponse.json(
      {
        success: false,
        message: `Cannot deactivate — client has ${activePolicies} active ${activePolicies === 1 ? "policy" : "policies"}. Lapse or transfer them first.`,
      },
      { status: 400 }
    );
  }

  const client = await Client.findByIdAndUpdate(
    params.id,
    { isActive: false, status: "inactive", deletedAt: new Date() },
    { new: true }
  );

  if (!client) {
    return NextResponse.json({ success: false, message: "Client not found" }, { status: 404 });
  }

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "DELETE",
    entity: "Client",
    entityId: client._id.toString(),
    details: `Soft-deleted client: ${client.fullName}`,
  });

  return NextResponse.json({ success: true, message: "Client deactivated" });
}
