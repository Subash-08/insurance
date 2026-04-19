import React from 'react';
import { getRequiredSession } from '@/lib/session';
import dbConnect from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { buildDataFilter } from '@/lib/data-filter';
import LeadsClient from './LeadsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leads Pipeline | InsureFlow',
};

// Next.js dynamic rendering required as leads data updates frequently
export const dynamic = 'force-dynamic';

export default async function LeadsPipelinePage() {
  const session = await getRequiredSession();
  await dbConnect();
  
  const filter = buildDataFilter(session);
  const rawLeads = await Lead.find(filter).sort({ createdAt: -1 }).lean();

  // Compute stats 
  const stats = {
    totalPipeline: 0,
    staleLeads: 0,
  };

  const now = Date.now();
  const staleThreshold = 3 * 24 * 60 * 60 * 1000;

  const initialData = rawLeads.map((lead: any) => {
    // Stale logic
    const isStale = lead.lastContactedAt 
      ? (now - new Date(lead.lastContactedAt).getTime()) > staleThreshold 
      : false;
      
    if (isStale && lead.stage !== 'won' && lead.stage !== 'lost') {
      stats.staleLeads++;
    }

    if (lead.stage !== 'won' && lead.stage !== 'lost') {
      stats.totalPipeline += (lead.estimatedSumAssured || 0);
    }
    
    return {
      _id: lead._id.toString(),
      fullName: lead.fullName,
      phone: lead.phone,
      stage: lead.stage,
      priority: lead.priority,
      estimatedSumAssured: lead.estimatedSumAssured,
      isStale,
    };
  });

  return (
    <LeadsClient initialData={initialData} stats={stats} />
  );
}
