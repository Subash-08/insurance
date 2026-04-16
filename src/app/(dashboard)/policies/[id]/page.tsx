import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import PolicyDetailClient from '@/components/policies/PolicyDetailClient';

export const metadata = {
  title: 'Policy Details — InsureFlow',
  description: 'View and manage policy details and premium schedule',
};

export default async function PolicyDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const user = session.user as any;

  return <PolicyDetailClient policyId={params.id} userRole={user.role} userId={user.id} />;
}
