import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import dbConnect from "@/lib/mongodb";
import Document from "@/models/Document";
import cloudinary from "@/lib/cloudinary";
import { buildDataFilter } from "@/lib/data-filter";

async function handler(req: NextRequest, ctx: any, session: any) {
  await dbConnect();

  if (req.method === "GET") {
    // Get all docs for this agency, optionally filtered by entity
    const filter = buildDataFilter(session);
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const documentType = searchParams.get("documentType");

    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (documentType) filter.documentType = documentType;

    const docs = await Document.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: docs });
  }

  if (req.method === "POST") {
    // We expect multipart/form-data with `file` and metadata
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;
    const documentType = formData.get("documentType") as string;
    const expiryDateStr = formData.get("expiryDate") as string;
    
    if (!file || !entityType || !entityId || !documentType) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Validate size and type
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "File exceeds 10MB limit" }, { status: 400 });
    }
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: "Invalid file type. Only JPG, PNG, PDF allowed" }, { status: 400 });
    }

    // Convert file to buffer for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resolve agencyId — owners may not have agencyId in the JWT;
    // their own user _id doubles as the agency root (same pattern as /api/leads).
    const agencyId: string = session.user.agencyId || session.user.id;

    // Upload to Cloudinary using upload_stream
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `insureflow/${agencyId}/${entityType}/${entityId}` },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const newDoc = await Document.create({
      agentId: session.user.id,
      agencyId,
      fileName: file.name,
      fileType: file.type.split("/")[1] || "unknown",
      mimeType: file.type,
      sizeBytes: file.size,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      entityType,
      entityId,
      documentType,
      expiryDate: expiryDateStr ? new Date(expiryDateStr) : undefined,
    });

    return NextResponse.json({ success: true, data: newDoc }, { status: 201 });
  }

  throw new Error(`Method ${req.method} not allowed`);
}

export const GET = withApiHandler(handler, true);
export const POST = withApiHandler(handler, true);
