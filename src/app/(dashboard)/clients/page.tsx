import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ClientsListClient from '@/components/clients/ClientsListClient';

export const metadata = {
  title: 'Clients — InsureFlow',
  description: 'Manage your client book',
};

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const user = session.user as any;

  return <ClientsListClient userRole={user.role} userId={user.id} />;
}
