import Link from 'next/link';
import EmptyState from '@/components/shared/EmptyState';

export default function AddLeadPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Add Lead</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a new lead.</p>
        </div>
        <Link href="/leads" className="text-sm font-medium text-primary border border-primary px-4 py-2 rounded">
          Back
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-border shadow-sm p-8 flex items-center justify-center">
         <EmptyState title="No content yet" description="This module is under construction." />
      </div>
    </div>
  );
}
