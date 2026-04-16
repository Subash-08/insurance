import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ClientDetailClient from '@/components/clients/ClientDetailClient';

export const metadata = {
  title: 'Client Profile — InsureFlow',
  description: 'View and manage client details',
};

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const user = session.user as any;

  return <ClientDetailClient clientId={params.id} userRole={user.role} userId={user.id} />;
}
