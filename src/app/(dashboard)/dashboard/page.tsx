import React from 'react';
import { getRequiredSession } from '@/lib/session';
import OwnerDashboard from '@/components/dashboard/OwnerDashboard';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';

export default async function DashboardPage() {
  const session = await getRequiredSession();

  // Return the bifurcated layout natively passing the single session downward.
  if (session.user.role === 'owner') {
    return <OwnerDashboard session={session} />;
  }

  return <EmployeeDashboard session={session} />;
}
