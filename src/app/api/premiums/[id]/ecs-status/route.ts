import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Premium from "@/models/Premium";
import AuditLog from "@/models/AuditLog";
import { z } from "zod";

const ecsStatusSchema = z.object({
  status: z.enum(["paid", "ecs_failed"]),
  reason: z.string().optional()
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const parsed = ecsStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // RETRY STRATEGY FOR OCC conflicts
    const MAX_RETRIES = 3;
    let attempt = 0;
    let savedPremium = null;

    while (attempt < MAX_RETRIES) {
      const premium = await Premium.findById(params.id);
      if (!premium) {
        return NextResponse.json({ success: false, error: "Premium not found" }, { status: 404 });
      }

      if (session.user.role !== "owner" && premium.agentId.toString() !== session.user.id) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      if (premium.status !== "ecs_pending") {
        return NextResponse.json({ success: false, error: "Premium is not pending ECS confirmation" }, { status: 400 });
      }

      const currentVersion = premium.__v;

      const updateSet: any = {};
      const updateInc: any = { __v: 1 };

      if (data.status === "ecs_failed") {
        updateSet.status = "ecs_failed";
        updateInc.failedEcsAttempts = 1;
        if (data.reason) updateSet.notes = `ECS Failed: ${data.reason}`;
      } else if (data.status === "paid") {
        // Technically ECS Success should be handled via the generic /pay endpoint as it involves
        // receipt numbers, history updates, and commission.
        return NextResponse.json({ success: false, error: "ECS Success should be recorded via the /pay endpoint" }, { status: 400 });
      }

      // Attempt Save via OCC
      const updateResult = await Premium.findOneAndUpdate(
        { _id: premium._id, __v: currentVersion },
        {
          $set: updateSet,
          $inc: updateInc
        },
        { new: true }
      );

      if (updateResult) {
        savedPremium = updateResult;
        break;
      } else {
        attempt++;
        if (attempt >= MAX_RETRIES) {
          return NextResponse.json(
            { success: false, error: "Concurrent modifications prevented saving. Please try again." },
            { status: 409 }
          );
        }
      }
    }

    if (!savedPremium) {
      return NextResponse.json({ success: false, error: "ECS Status Update failed." }, { status: 500 });
    }

    await AuditLog.create({
      userId: session.user.id,
      action: "Updated",
      module: "Premium",
      details: `Recorded ECS status ${data.status} for premium ${savedPremium._id}. Reason: ${data.reason || "N/A"}`,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ success: true, premium: savedPremium });

  } catch (error: any) {
    console.error("[PREMIUM_ECS_PATCH]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
