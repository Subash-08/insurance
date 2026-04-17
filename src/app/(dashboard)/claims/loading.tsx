export default function ClaimsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="px-4 py-4 border-b border-gray-100 dark:border-gray-700 flex gap-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
