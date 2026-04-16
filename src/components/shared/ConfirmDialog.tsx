export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, description }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm mt-2 text-gray-500">{description}</p>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border rounded text-sm">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-destructive text-white rounded text-sm">Confirm</button>
        </div>
      </div>
    </div>
  );
}
