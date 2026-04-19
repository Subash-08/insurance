import React from "react";
import dbConnect from "@/lib/mongodb";
import Document from "@/models/Document";
import { getRequiredSession } from "@/lib/session";
import { buildDataFilter } from "@/lib/data-filter";
import { Metadata } from "next";
import DocumentVaultClient from "./DocumentVaultClient";

export const metadata: Metadata = {
  title: "Document Vault | InsureFlow",
};

export const dynamic = "force-dynamic";

export default async function DocumentVaultPage() {
  const session = await getRequiredSession();
  await dbConnect();

  const filter = buildDataFilter(session);
  const rawDocs = await Document.find(filter).sort({ createdAt: -1 }).lean();

  const docs = rawDocs.map((doc: any) => ({
    ...doc,
    _id: doc._id.toString(),
    agentId: doc.agentId?.toString(),
    agencyId: doc.agencyId?.toString(),
    entityId: doc.entityId?.toString(),
    expiryDate: doc.expiryDate?.toISOString() || null,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
    shareLinks: undefined, // Don't send share targets down unless needed to minimize payload
  }));

  return <DocumentVaultClient initialDocs={docs} />;
}
