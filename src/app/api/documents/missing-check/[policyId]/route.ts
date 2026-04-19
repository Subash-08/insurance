import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Document from "@/models/Document";
import Policy from "@/models/Policy";
import { getMissingDocuments, PolicyType } from "@/lib/documentRequirements";
import { checkOwnership } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();
  const { policyId } = ctx.params;

  if (req.method === "GET") {
    const policy = await Policy.findOne({ _id: policyId, isActive: true }).lean() as any;
    if (!policy) throw new Error("Policy not found");
    if (!checkOwnership(policy, session)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const typeStr = policy.type.toLowerCase();
    
    // Map existing policy types to our internal logical types if needed, fallback to general
    let logicalType: PolicyType = "general";
    if (typeStr.includes("health")) logicalType = "health";
    else if (typeStr.includes("motor") || typeStr.includes("car") || typeStr.includes("bike")) logicalType = "motor";
    else if (typeStr.includes("term")) logicalType = "term";
    else if (typeStr.includes("ulip")) logicalType = "ulip";
    else if (typeStr.includes("endowment")) logicalType = "endowment";

    const docs = await Document.find({
      entityType: "Policy",
      entityId: policyId,
      isActive: true,
      status: "active"
    }).lean();

    const existingTypes = docs.map((doc: any) => doc.documentType);
    const missing = getMissingDocuments(logicalType, existingTypes);

    return NextResponse.json({
      success: true,
      data: {
        logicalType,
        missing,
        isComplete: missing.length === 0
      }
    });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const GET = withApiHandler(handler, true);
