import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import PolicyWizard from '@/components/policies/PolicyWizard';

export const metadata = {
  title: 'Issue New Policy — InsureFlow',
  description: '5-step wizard to issue new policies and generate premium schedules',
};

export default async function NewPolicyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Issue New Policy</h1>
        <p className="text-sm text-gray-500 mt-1">Complete the wizard to onboard a new policy and generate its premium schedule.</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
         <PolicyWizard />
      </div>
    </div>
  );
}
