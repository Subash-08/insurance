import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Claim from "@/models/Claim";
import Policy from "@/models/Policy";
import Client from "@/models/Client";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { buildDocumentChecklist } from "@/lib/claims-helpers";
import { z } from "zod";

const claimSchema = z.object({
  policyId: z.string().min(1, "Policy required"),
  clientId: z.string().min(1, "Client required"),
  claimType: z.enum(["death", "maturity", "accident", "health", "vehicle", "fire", "travel", "critical_illness"]),
  incidentDate: z.string(),
  description: z.string().min(20).max(2000),
  estimatedAmount: z.number().positive(),
  hospitalName: z.string().optional(),
  garageName: z.string().optional(),
  doctorName: z.string().optional(),
  vehicleRegistration: z.string().optional(),
  insurerClaimNumber: z.string().optional(),
  forceCreate: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const claimType = searchParams.get("type");
    const search = searchParams.get("search");

    const filter: any = {};
    // Role isolation: employees only see their own claims
    if (session.user.role !== "owner") {
      filter.agentId = session.user.id;
    }

    if (status && status !== "all") filter.status = status;
    if (claimType) filter.claimType = claimType;

    if (search) {
      filter.$or = [
        { claimNumber: { $regex: search, $options: "i" } },
        { insurerClaimNumber: { $regex: search, $options: "i" } },
      ];
    }

    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "clientId", model: Client, select: "fullName mobile" })
        .populate({ path: "policyId", model: Policy, select: "policyNumber type insurerId" })
        .populate({ path: "agentId", model: User, select: "name" })
        .lean(),
      Claim.countDocuments(filter),
    ]);

    // Compute daysPending server-side in IST
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const enriched = claims.map((c: any) => ({
      ...c,
      daysPending: ["closed", "rejected"].includes(c.status)
        ? null
        : Math.floor((nowIST.getTime() - new Date(c.createdAt).getTime()) / 86400000),
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error("[CLAIMS_GET]", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const body = await req.json();
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;

    // ── Duplicate claim prevention (hard check) ───────────────────────────────
    const existingOpen = await Claim.findOne({
      policyId: data.policyId,
      claimType: data.claimType,
      status: { $nin: ["closed", "rejected"] },
    }).select("claimNumber").lean() as any;

    if (existingOpen && !data.forceCreate) {
      return NextResponse.json({
        success: false,
        error: "duplicate_claim",
        existingClaimNumber: existingOpen.claimNumber,
        message: `An open ${data.claimType} claim already exists for this policy (${existingOpen.claimNumber}). Pass forceCreate: true to create another.`,
      }, { status: 409 });
    }

    // ── Fetch policy for extra context ───────────────────────────────────────
    const policy: any = await Policy.findById(data.policyId).lean();
    if (!policy) {
      return NextResponse.json({ success: false, error: "Policy not found" }, { status: 404 });
    }

    const isLapsed = policy.status === "lapsed";

    // ── Build document checklist ─────────────────────────────────────────────
    const documents = buildDocumentChecklist(data.claimType);

    // ── Create claim ──────────────────────────────────────────────────────────
    const claim = await Claim.create({
      policyId: data.policyId,
      clientId: data.clientId,
      agentId: session.user.id,
      claimType: data.claimType,
      incidentDate: new Date(data.incidentDate),
      description: data.description,
      estimatedAmount: data.estimatedAmount,
      hospitalName: data.hospitalName,
      garageName: data.garageName,
      doctorName: data.doctorName,
      vehicleRegistration: data.vehicleRegistration || policy.vehicleRegistration,
      insurerClaimNumber: data.insurerClaimNumber,
      isLapsedPolicyWarning: isLapsed,
      documents,
      statusHistory: [{
        status: "filed",
        changedBy: session.user.id,
        changedAt: new Date(),
        notes: "Claim filed",
      }],
    });

    // ── Death claim: flag client as deceased ──────────────────────────────────
    if (data.claimType === "death") {
      await Client.findByIdAndUpdate(data.clientId, { $set: { isDeceased: true } });
    }

    // ── Audit Log ──────────────────────────────────────────────────────────────
    await AuditLog.create({
      userId: session.user.id,
      action: "Created",
      module: "Claim",
      details: `Filed claim ${claim.claimNumber} for policy ${policy.policyNumber}`,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ success: true, claim }, { status: 201 });
  } catch (err: any) {
    console.error("[CLAIMS_POST]", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
