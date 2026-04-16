import Link from 'next/link';
import EmptyState from '@/components/shared/EmptyState';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Agency preferences.</p>
        </div>
        <Link href="/settings/new" className="text-sm font-medium text-white bg-primary px-4 py-2 rounded">
          Add New
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-border shadow-sm p-8 flex items-center justify-center">
         <EmptyState title="No content yet" description="This module is under construction." />
      </div>
    </div>
  );
}
