import React from 'react';
import { getRequiredSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import TeamManagementClient from '@/components/settings/TeamManagementClient';

export default async function TeamManagementPage() {
  const session = await getRequiredSession();
  
  if (session.user.role !== 'owner') {
    redirect('/dashboard');
  }

  return <TeamManagementClient />;
}
