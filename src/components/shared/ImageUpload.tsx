import React from 'react';

export default function ImageUpload({ value, onChange, shape, maxSizeMB, acceptedTypes, label, showFilename }: any) {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className={`border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center p-6 ${shape === 'circle' ? 'rounded-full w-32 h-32' : 'w-full h-32'}`}>
         <span className="text-gray-500 text-sm">Upload {label}</span>
      </div>
    </div>
  );
}
