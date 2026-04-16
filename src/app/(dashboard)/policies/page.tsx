import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import PoliciesListClient from '@/components/policies/PoliciesListClient';

export const metadata = {
  title: 'Policies — InsureFlow',
  description: 'Manage policies',
};

export default async function PoliciesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  
  const user = session.user as any;

  return <PoliciesListClient userRole={user.role} userId={user.id} />;
}
