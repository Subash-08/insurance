import React from 'react';
import { redirect } from 'next/navigation';
import { getRequiredSession } from '@/lib/session';
import SessionLoader from '@/components/layout/SessionLoader';
import DashboardShell from '@/components/layout/DashboardShell';
import AuthProvider from '@/components/providers/AuthProvider';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 1. Call getRequiredSession
  const session = await getRequiredSession();

  // 2. Status check
  if (session.user.status !== 'active') {
    redirect('/pending-approval');
  }

  // 3. Render
  return (
    <AuthProvider session={session}>
      <SessionLoader>
        <DashboardShell>
          {children}
        </DashboardShell>
      </SessionLoader>
    </AuthProvider>
  );
}
