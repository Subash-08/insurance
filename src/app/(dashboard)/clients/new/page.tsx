import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ClientForm from '@/components/clients/ClientForm';

export const metadata = {
  title: 'Add Client — InsureFlow',
  description: 'Add a new client to your book',
};

export default async function NewClientPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Client</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details below to add a new client.</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
         <ClientForm />
      </div>
    </div>
  );
}
