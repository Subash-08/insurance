export default function DataTable({ columns, data }: any) {
  return (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
           <tr>{columns?.map((col: any) => <th key={col.key} className="px-6 py-3">{col.label}</th>)}</tr>
        </thead>
        <tbody>
           {data?.length === 0 && <tr><td colSpan={columns?.length} className="text-center py-4">No records found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
