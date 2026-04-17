import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Premium from "@/models/Premium";
import Policy from "@/models/Policy";
import Client from "@/models/Client";
import User from "@/models/User";
import Insurer from "@/models/Insurer";
import { generateReceiptPDF, ReceiptData } from "@/lib/pdf/receipt-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const txId = req.nextUrl.searchParams.get("txId");

    const premium: any = await Premium.findById(params.id)
      .populate({ path: "policyId", model: Policy })
      .populate({ path: "clientId", model: Client })
      .populate({ path: "agentId", model: User })
      .populate({ path: "agencyId", model: User })
      .lean();

    if (!premium) {
      return NextResponse.json({ success: false, error: "Premium not found" }, { status: 404 });
    }

    if (session.user.role !== "owner" && premium.agentId._id.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    let targetTx = null;
    if (txId) {
      targetTx = premium.paymentHistory.find((tx: any) => tx._id.toString() === txId && !tx.isBounced);
    } else {
      targetTx = premium.paymentHistory
        .filter((tx: any) => !tx.isBounced)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }

    if (!targetTx) {
      return NextResponse.json({ success: false, error: "Valid payment transaction not found" }, { status: 404 });
    }

    const insurer: any = await Insurer.findById(premium.policyId.insurerId).lean();

    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(targetTx.amount / 100);

    const formattedDate = new Intl.DateTimeFormat("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata"
    }).format(new Date(targetTx.date));

    let formattedNextDue;
    if (premium.policyId.nextPremiumDue) {
      formattedNextDue = new Intl.DateTimeFormat("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata"
      }).format(new Date(premium.policyId.nextPremiumDue));
    }

    const receiptData: ReceiptData = {
      agencyName: premium.agencyId.name || "InsureFlow Agency",
      clientName: premium.clientId.name,
      policyNumber: premium.policyId.policyNumber,
      insurerName: insurer ? insurer.name : "Unknown Insurer",
      policyType: premium.policyId.type.toUpperCase(),
      amount: formattedAmount,
      paymentDate: formattedDate,
      paymentMode: targetTx.mode,
      receiptNumber: targetTx.receiptNumber,
      referenceNumber: targetTx.utrNumber || targetTx.chequeNumber,
      agentName: premium.agentId.name,
      agentPhone: premium.agentId.mobile,
      nextDueDate: formattedNextDue
    };

    const pdfStream = await generateReceiptPDF(receiptData);

    const response = new NextResponse(pdfStream as any);
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set("Content-Disposition", `attachment; filename="receipt-${targetTx.receiptNumber}.pdf"`);

    return response;

  } catch (error: any) {
    console.error("[PREMIUM_RECEIPT_GET]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
