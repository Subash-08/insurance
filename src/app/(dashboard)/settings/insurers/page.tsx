import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import InsurersClient from '@/components/settings/InsurersClient';

export const metadata = {
  title: 'Insurers — InsureFlow Settings',
  description: 'Manage insurer master list, plans, and helplines',
};

export default async function InsurersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const user = session.user as any;
  // Only owner can access this page
  if (user.role !== 'owner') {
    redirect('/dashboard?error=access_denied');
  }

  return <InsurersClient />;
}
