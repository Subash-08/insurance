export default function EmptyState({ icon, title, description, ctaLabel, ctaHref }: any) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-12">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}
