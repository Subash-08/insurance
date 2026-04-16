import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import Premium from "@/models/Premium";
import { logAudit, computeHealthScore } from "@/lib/insurance";
import mongoose from "mongoose";

// ─── Helper: Compute health score for a client ───────────────────────────────
// Grace-period-aware: overdue = today > dueDate + gracePeriodDays
async function getClientHealthScore(clientId: string): Promise<"green" | "amber" | "red"> {
  const today = new Date();

  const unpaidPremiums = await Premium.find({
    clientId,
    status: { $nin: ["paid", "cancelled"] },
  })
    .select("dueDate gracePeriodDays")
    .lean();

  let overdueCount = 0;
  let maxOverdueDays = 0;

  for (const rec of unpaidPremiums as any[]) {
    const graceDeadline = new Date(rec.dueDate);
    graceDeadline.setDate(graceDeadline.getDate() + (rec.gracePeriodDays ?? 30));
    if (today > graceDeadline) {
      overdueCount++;
      const daysOverdue = Math.floor(
        (today.getTime() - graceDeadline.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysOverdue > maxOverdueDays) maxOverdueDays = daysOverdue;
    }
  }

  return computeHealthScore(overdueCount, maxOverdueDays);
}

// ─── GET /api/clients ─────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const city = searchParams.get("city") || "";
  const status = searchParams.get("status") || "";
  const tags = searchParams.get("tags") || "";
  const agentFilter = searchParams.get("agent") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const sort = searchParams.get("sort") || "date_desc";

  await dbConnect();

  const query: Record<string, unknown> = { isActive: true };

  if (user.role === "employee") {
    query.agentId = new mongoose.Types.ObjectId(user.id);
  } else if (agentFilter) {
    query.agentId = new mongoose.Types.ObjectId(agentFilter);
  }

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { panNumber: { $regex: search, $options: "i" } },
    ];
  }
  if (city) query["address.city"] = { $regex: city, $options: "i" };
  if (status) query.status = status;
  if (tags) {
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (tagList.length) query.tags = { $in: tagList };
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    name_asc: { fullName: 1 },
    name_desc: { fullName: -1 },
    date_asc: { createdAt: 1 },
    date_desc: { createdAt: -1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const clientQuery = Client.find(query)
    .select("fullName phone email address tags status createdAt agentId")
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);

  if (user.role === "owner") {
    clientQuery.populate({ path: "agentId", select: "name email" });
  }

  const [clients, total] = await Promise.all([
    clientQuery.lean(),
    Client.countDocuments(query),
  ]);

  const clientsWithScore = await Promise.all(
    (clients as any[]).map(async (c) => ({
      ...c,
      healthScore: await getClientHealthScore(c._id.toString()),
    }))
  );

  return NextResponse.json({
    success: true,
    data: clientsWithScore,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

// ─── POST /api/clients ────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;

  const body = await req.json();
  await dbConnect();

  let agencyId: string;
  if (user.role === "owner") {
    agencyId = user.id;
  } else {
    const User = (await import("@/models/User")).default;
    const owner = await User.findOne({ role: "owner", status: "active" }).select("_id").lean() as any;
    if (!owner) {
      return NextResponse.json({ success: false, message: "Agency owner not found" }, { status: 500 });
    }
    agencyId = owner._id.toString();
  }

  const nominees = body.nominees || [];
  if (nominees.length > 0) {
    const totalShare = nominees.reduce((sum: number, n: any) => sum + (n.share || 0), 0);
    if (Math.abs(totalShare - 100) > 0.01) {
      return NextResponse.json(
        { success: false, message: "Nominee shares must sum to exactly 100%", field: "nominees" },
        { status: 400 }
      );
    }
    for (const n of nominees) {
      if (n.isMinor && !n.guardianName) {
        return NextResponse.json(
          { success: false, message: `Guardian name required for minor nominee "${n.name}"`, field: "nominees" },
          { status: 400 }
        );
      }
    }
  }

  const processedNominees = nominees.map((n: any) => ({
    ...n,
    isMinor: n.dob
      ? (new Date().getTime() - new Date(n.dob).getTime()) / (365.25 * 24 * 3600 * 1000) < 18
      : false,
  }));

  const clientData: Record<string, any> = {
    ...body,
    agentId: user.id,         // NEVER from body
    agencyId,                  // NEVER from body
    nominees: processedNominees,
  };
  delete clientData._id;

  // Remove optional indexed fields entirely when absent so the sparse unique
  // index on (agencyId, panNumber) is not triggered for null values.
  if (body.panNumber?.trim()) {
    clientData.panNumber = body.panNumber.toUpperCase().trim();
  } else {
    delete clientData.panNumber;
  }

  if (body.aadhaarLast4) {
    clientData.aadhaarLast4 = String(body.aadhaarLast4).slice(-4);
  } else {
    delete clientData.aadhaarLast4;
  }

  let client;
  try {
    client = await Client.create(clientData);
  } catch (err: any) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "";
      if (field.includes("phone")) {
        return NextResponse.json(
          { success: false, message: "A client with this phone number already exists", field: "phone" },
          { status: 409 }
        );
      }
      if (field.includes("pan")) {
        return NextResponse.json(
          { success: false, message: "A client with this PAN number already exists", field: "panNumber" },
          { status: 409 }
        );
      }
    }
    console.error("[POST /api/clients]", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }

  logAudit({
    userId: user.id,
    userRole: user.role,
    action: "CREATE",
    entity: "Client",
    entityId: client._id.toString(),
    details: `Created client: ${client.fullName}`,
  });

  return NextResponse.json({ success: true, data: client }, { status: 201 });
}
