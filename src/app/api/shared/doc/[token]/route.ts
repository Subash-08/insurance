import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Document from "@/models/Document";
import { rateLimitPublic } from "@/lib/rate-limit";

// This is a PUBLIC endpoint. No withApiHandler. No session required.
export async function GET(req: NextRequest, ctx: { params: { token: string } }) {
  try {
    const { token } = ctx.params;
    
    // IP-based Rate Limiting (Public tier - 20 req/min, burst: 10 req/5s)
    const rateLimitResponse = rateLimitPublic(req);
    if (rateLimitResponse) return rateLimitResponse;

    const ip = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";

    await dbConnect();

    // Find document containing this token
    const doc = await Document.findOne({ "shareLinks.token": token });
    if (!doc) {
      return NextResponse.json({ success: false, message: "Document not found or link invalid" }, { status: 404 });
    }

    const shareLink = doc.shareLinks.find((sl: any) => sl.token === token);
    if (!shareLink) {
      return NextResponse.json({ success: false, message: "Link not found" }, { status: 404 });
    }

    // Validation checks
    if (shareLink.isRevoked) {
      return NextResponse.json({ success: false, message: "This link has been revoked" }, { status: 403 });
    }
    if (new Date() > new Date(shareLink.expiresAt)) {
      return NextResponse.json({ success: false, message: "This link has expired" }, { status: 403 });
    }
    if (shareLink.accessCount >= shareLink.maxAccessCount) {
      return NextResponse.json({ success: false, message: "This link has reached its maximum access limit" }, { status: 403 });
    }

    // Increment access count
    shareLink.accessCount += 1;
    shareLink.accessedAt = new Date();
    shareLink.accessedByIp = ip;
    shareLink.accessedByUserAgent = req.headers.get("user-agent") || "unknown";

    await doc.save();

    // Return the cloudinary info securely. We don't expose agency or agent details unnecessarily.
    return NextResponse.json({
      success: true,
      data: {
        fileName: doc.fileName,
        fileType: doc.fileType,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        cloudinaryUrl: doc.cloudinaryUrl,
      }
    });

  } catch (error) {
    console.error("Public share link error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
