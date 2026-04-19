import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Premium from "@/models/Premium";
import AuditLog from "@/models/AuditLog";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ success: false, error: "Unauthorized. Owner role required." }, { status: 403 });
  }

  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const dryRun = searchParams.get("dryRun") !== "false"; // Default to true if missing
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const batchLimit = Math.min(limit, 500); // hard cap 500

    const premiums = await Premium.find({}).limit(batchLimit);

    const results = {
      evaluated: premiums.length,
      driftCount: 0,
      repaired: 0,
      driftedIds: [] as string[],
    };

    for (const p of premiums) {
      // Create a transient comparison
      const originalAmount = p.paidAmount;
      const originalBalance = p.balanceAmount;
      const originalStatus = p.status;

      p.recalculateState();

      const hasDrift =
        p.paidAmount !== originalAmount ||
        p.balanceAmount !== originalBalance ||
        p.status !== originalStatus;

      if (hasDrift) {
        results.driftCount++;
        results.driftedIds.push(p._id.toString());

        if (!dryRun) {
          // Attempt repair via optimistic save
          await Premium.findOneAndUpdate(
            { _id: p._id },
            {
              $set: {
                paidAmount: p.paidAmount,
                balanceAmount: p.balanceAmount,
                status: p.status
              },
              $inc: { __v: 1 }
            }
          );

          results.repaired++;

          await AuditLog.create({
            userId: session.user.id,
            action: "UPDATE",
            entity: "Premium",
            details: `Admin repaired state drift. Paid: ${originalAmount}->${p.paidAmount}, Bal: ${originalBalance}->${p.balanceAmount}, Status: ${originalStatus}->${p.status}`,
            ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
            userAgent: req.headers.get("user-agent") ?? "unknown",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `Dry run completed. Found ${results.driftCount} drifted premiums out of ${results.evaluated} evaluated.`
        : `Repair completed. Fixed ${results.repaired} drifted premiums out of ${results.evaluated} evaluated.`,
      results
    });

  } catch (error: any) {
    console.error("[PREMIUMS_REPAIR_SYNC]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
