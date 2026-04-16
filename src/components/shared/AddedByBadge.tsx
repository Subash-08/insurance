'use client';

import React from 'react';
import OwnerOnly from '../layout/OwnerOnly';

export default function AddedByBadge({ agentName }: { agentName?: string }) {
  if (!agentName) return null;
  
  return (
    <OwnerOnly>
      <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-[8px] shrink-0">
          {agentName[0]?.toUpperCase()}
        </div>
        <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
          Added by {agentName.split(' ')[0]}
        </span>
      </div>
    </OwnerOnly>
  );
}
