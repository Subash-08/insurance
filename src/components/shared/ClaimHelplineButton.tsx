'use client';

import React from 'react';
import { Copy, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface ClaimHelplineButtonProps {
  helpline: string;
  insurerName: string;
  size?: 'sm' | 'md';
}

export default function ClaimHelplineButton({
  helpline,
  insurerName,
  size = 'md',
}: ClaimHelplineButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(helpline);
      toast.success(`${insurerName} helpline number copied!`);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <a
        href={`tel:${helpline}`}
        className={`flex items-center gap-1.5 font-mono font-semibold text-emerald-700 dark:text-emerald-400 hover:underline ${size === 'sm' ? 'text-sm' : 'text-base'}`}
      >
        <Phone size={size === 'sm' ? 13 : 15} />
        {helpline}
      </a>
      <button
        onClick={handleCopy}
        title="Copy to clipboard"
        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Copy size={13} />
      </button>
    </div>
  );
}
