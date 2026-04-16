import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Policy from "@/models/Policy";
import Premium from "@/models/Premium";
import Client from "@/models/Client";
import {
  logAudit,
  generatePremiumSchedule,
  computeGST,
  getDefaultGracePeriod,
} from "@/lib/insurance";
import mongoose from "mongoose";

// ─── GET /api/policies ────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const sort = searchParams.get("sort") || "createdAt_desc";

  await dbConnect();

  const query: Record<string, unknown> = { isActive: true };

  if (user.role === "employee") {
    query.agentId = new mongoose.Types.ObjectId(user.id);
  } else {
    const agentFilter = searchParams.get("agent");
    if (agentFilter) query.agentId = new mongoose.Types.ObjectId(agentFilter);
  }

  const clientId = searchParams.get("clientId");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const insurerId = searchParams.get("insurerId");
  const dueSoon = searchParams.get("dueSoon");
  const expiryMonth = searchParams.get("expiryMonth");
  const search = searchParams.get("search");

  if (clientId) query.clientId = new mongoose.Types.ObjectId(clientId);
  if (type) query.type = type;
  if (status) query.status = status;
  if (insurerId) query.insurerId = new mongoose.Types.ObjectId(insurerId);
  if (dueSoon) {
    const days = parseInt(dueSoon);
    const future = new Date();
    future.setDate(future.getDate() + days);
    query.nextPremiumDue = { $lte: future };
    query.status = "active";
  }
  if (expiryMonth) {
    const [year, month] = expiryMonth.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    query.expiryDate = { $gte: start, $lt: end };
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    nextPremiumDue_asc: { nextPremiumDue: 1 },
    maturityDate_asc: { maturityDate: 1 },
    createdAt_desc: { createdAt: -1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  let queryBuilder = Policy.find(query)
    .populate("clientId", "fullName phone")
    .populate("insurerId", "name logoUrl type")
    .populate(user.role === "owner" ? { path: "agentId", select: "name email" } : "")
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const [policies, total] = await Promise.all([
    queryBuilder,
    Policy.countDocuments(query),
  ]);

  // Handle search after populate (search against client name, policy number, insurer name)
  let result = policies as any[];
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (p: any) =>
        p.policyNumber?.toLowerCase().includes(s) ||
        p.clientId?.fullName?.toLowerCase().includes(s) ||
        p.insurerId?.name?.toLowerCase().includes(s)
    );
  }

  return NextResponse.json({
    success: true,
    data: result,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

// ─── POST /api/policies ───────────────────────────────────────────────────────
// Uses MongoDB transaction: if premium generation fails, policy is rolled back
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;

  const body = await req.json();
  const {
    clientId,
    insurerId,
    planName,
    type,
    policyNumber,
    startDate,
    maturityDate,
    expiryDate,
    premiumAmount, // in PAISE
    paymentFrequency,
    sumAssured,
    gracePeriodDays: bodyGrace,
    lifeDetails,
    healthDetails,
    vehicleDetails,
    ulipDetails,
  } = body;

  // Required field validation
  if (!clientId || !insurerId || !planName || !type || !policyNumber || !startDate || !premiumAmount || !paymentFrequency || !sumAssured) {
    return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
  }
  if (sumAssured < 100) {
    return NextResponse.json({ success: false, message: "Sum assured must be at least ₹1", field: "sumAssured" }, { status: 400 });
  }

  await dbConnect();

  // Verify client belongs to this agent (employees) or agency (owner)
  const client = await Client.findOne({ _id: clientId, isActive: true }).lean() as any;
  if (!client) {
    return NextResponse.json({ success: false, message: "Client not found" }, { status: 404 });
  }
  if (user.role === "employee" && client.agentId.toString() !== user.id) {
    return NextResponse.json({ success: false, message: "Client does not belong to you" }, { status: 403 });
  }

  // Determine agencyId
  let agencyId: string;
  if (user.role === "owner") {
    agencyId = user.id;
  } else {
    agencyId = client.agencyId?.toString() || user.id;
  }

  // GST + total
  const gstAmount = computeGST(premiumAmount);
  const totalPremium = premiumAmount + gstAmount;
  const gracePeriodDays = bodyGrace ?? getDefaultGracePeriod(type);

  // Determine end date for premium schedule
  const scheduleEndDate = maturityDate
    ? new Date(maturityDate)
    : expiryDate
    ? new Date(expiryDate)
    : null;

  if (!scheduleEndDate && paymentFrequency !== "single") {
    return NextResponse.json(
      { success: false, message: "maturityDate or expiryDate is required for recurring premium policies" },
      { status: 400 }
    );
  }

  // MongoDB transaction
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  let policy: any;
  let premiumCount = 0;

  try {
    policy = await Policy.create(
      [
        {
          agentId: user.id,
          agencyId,
          clientId,
          insurerId,
          policyNumber: policyNumber.trim(),
          planName,      // snapshot — immutable
          type,
          startDate: new Date(startDate),
          maturityDate: maturityDate ? new Date(maturityDate) : undefined,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          sumAssured,
          premiumAmount,
          gstAmount,
          totalPremium,
          paymentFrequency,
          gracePeriodDays,
          status: "active",
          lifeDetails,
          healthDetails,
          vehicleDetails,
          ulipDetails,
        },
      ],
      { session: mongoSession }
    );

    policy = policy[0];

    // Generate premium schedule
    const schedule = scheduleEndDate
      ? generatePremiumSchedule(
          new Date(startDate),
          scheduleEndDate,
          paymentFrequency,
          totalPremium,
          gracePeriodDays
        )
      : generatePremiumSchedule(new Date(startDate), new Date(startDate), "single", totalPremium, gracePeriodDays);

    premiumCount = schedule.length;

    if (schedule.length > 0) {
      const premiumDocs = schedule.map((s) => ({
        policyId: policy._id,
        clientId,
        agentId: user.id,
        agencyId,
        dueDate: s.dueDate,
        amount: s.amount,
        gracePeriodDays: s.gracePeriodDays,
        status: s.status,
      }));

      await Premium.insertMany(premiumDocs, { session: mongoSession });

      // Set nextPremiumDue on policy = first unpaid premium's due date
      const firstDue = schedule.find((s) => s.status !== "paid")?.dueDate;
      if (firstDue) {
        await Policy.findByIdAndUpdate(
          policy._id,
          { nextPremiumDue: firstDue },
          { session: mongoSession }
        );
        policy.nextPremiumDue = firstDue;
      }
    }

    await mongoSession.commitTransaction();
  } catch (err: any) {
    await mongoSession.abortTransaction();
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, message: "A policy with this number already exists in your agency", field: "policyNumber" },
        { status: 409 }
      );
    }
    console.error("[POST /api/policies] transaction failed:", err);
    return NextResponse.json({ success: false, message: "Failed to create policy" }, { status: 500 });
  } finally {
    await mongoSession.endSession();
  }

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "CREATE",
    entity: "Policy",
    entityId: policy._id.toString(),
    details: `Created policy ${policyNumber} with ${premiumCount} premium records`,
  });

  return NextResponse.json(
    {
      success: true,
      data: policy,
      message: `Policy created. ${premiumCount} premium records generated.`,
    },
    { status: 201 }
  );
}
