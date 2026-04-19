import React from "react";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { getRequiredSession } from "@/lib/session";
import { checkOwnership } from "@/lib/data-filter";
import { redirect } from "next/navigation";
import LeadDetailClient from "./LeadDetailClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead Details | InsureFlow",
};

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await getRequiredSession();
  await dbConnect();

  const rawLead = await Lead.findOne({ _id: params.id, isActive: true }).lean() as any;

  if (!rawLead || !checkOwnership(rawLead as any, session)) {
    redirect("/leads");
  }

  // Convert ObjectIds to strings to avoid passing non-serializable objects to Client component
  const lead = {
    ...rawLead,
    _id: rawLead._id.toString(),
    agentId: rawLead.agentId?.toString(),
    agencyId: rawLead.agencyId?.toString(),
    referredByClientId: rawLead.referredByClientId?.toString() || null,
    wonClientId: rawLead.wonClientId?.toString() || null,
    createdAt: rawLead.createdAt?.toISOString(),
    updatedAt: rawLead.updatedAt?.toISOString(),
    lastContactedAt: rawLead.lastContactedAt?.toISOString() || null,
    nextFollowUpDate: rawLead.nextFollowUpDate?.toISOString() || null,
    convertedAt: rawLead.convertedAt?.toISOString() || null,
    followUpNotes: rawLead.followUpNotes?.map((note: any) => ({
      ...note,
      _id: note._id?.toString(),
      addedBy: note.addedBy?.toString(),
      addedAt: note.addedAt?.toISOString(),
      nextFollowUpDate: note.nextFollowUpDate?.toISOString() || null,
    })) || [],
  };

  return <LeadDetailClient lead={lead} />;
}
