"use client";

import React, { useEffect, useState } from "react";
import { Download, AlertCircle, Loader2, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  token: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
}

export default function DocumentViewerClient({ token, fileName, fileType, mimeType, sizeBytes }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [iframeFailed, setIframeFailed] = useState(false);

  useEffect(() => {
    async function loadSecureUrl() {
      try {
        const res = await fetch(`/api/shared/doc/${token}`);
        const data = await res.json();
        
        if (data.success && data.data.cloudinaryUrl) {
           setUrl(data.data.cloudinaryUrl);
        } else {
           setError(data.message || "Failed to establish secure connection.");
        }
      } catch {
        setError("Network error. Could not connect to vault.");
      } finally {
        setLoading(false);
      }
    }
    loadSecureUrl();
  }, [token]);

  const handleDownload = () => {
    if (!url) return;
    
    // Fallback cascade logic
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName; // Note: Cross-origin downloads might just open in a new tab
      // Setting target=_blank is a safe fallback
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Download started");
    } catch {
       window.open(url, '_blank');
    }
  };

  if (loading) {
     return (
       <div className="flex-1 flex flex-col items-center justify-center text-white">
          <Loader2 size={48} className="animate-spin text-primary mb-4" />
          <p className="text-gray-400 animate-pulse">Establishing encrypted tunnel...</p>
       </div>
     );
  }

  if (error || !url) {
     return (
       <div className="flex-1 flex flex-col items-center justify-center text-white p-6 text-center">
          <AlertCircle size={64} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Connection Terminated</h2>
          <p className="text-gray-400">{error || "Unknown error occurred"}</p>
       </div>
     );
  }

  const isPdf = mimeType.includes("pdf");
  const isImage = mimeType.includes("image");

  return (
    <>
      <div className="bg-gray-950 p-4 border-b border-gray-800 flex justify-between items-center z-10 shrink-0">
         <div className="flex items-center text-white">
            <FileText size={20} className="mr-3 text-gray-400" />
            <div>
              <p className="font-medium truncate max-w-[200px] sm:max-w-md">{fileName}</p>
              <p className="text-xs text-gray-500">
                 {(sizeBytes / 1024 / 1024).toFixed(2)} MB • {fileType.toUpperCase()}
              </p>
            </div>
         </div>
         <button 
           onClick={handleDownload}
           className="flex items-center bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-primary/20"
         >
           <Download size={16} className="mr-2" /> Download
         </button>
      </div>

      <div className="flex-1 overflow-hidden relative bg-gray-900 flex items-center justify-center p-4">
        {iframeFailed ? (
            <div className="text-center text-white p-8 bg-gray-800 rounded-xl border border-gray-700">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Secure Link Ready</h3>
              <p className="text-gray-400 mb-6 max-w-sm">
                Your browser blocked the inline preview for security reasons. You can open the document directly.
              </p>
              <button 
                onClick={handleDownload}
                className="bg-primary px-6 py-3 rounded-lg font-semibold inline-flex items-center"
              >
                Open Document <Download size={16} className="ml-2" />
              </button>
            </div>
        ) : isPdf ? (
            <iframe 
               src={`${url}#toolbar=0`} 
               className="w-full h-full border-none rounded bg-white"
               onError={() => setIframeFailed(true)}
               title="Secure PDF Viewer"
            />
        ) : isImage ? (
           <div className="w-full h-full relative flex items-center justify-center bg-black/50 rounded overflow-hidden p-4">
              {/* Using standard img to avoid Next.js Image optimization limitations with external URLs if not configured, 
                  plus we want full original quality render here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                 src={url} 
                 alt={fileName} 
                 className="max-w-full max-h-full object-contain drop-shadow-2xl"
                 onError={() => setIframeFailed(true)}
              />
           </div>
        ) : (
           <div className="text-center text-white p-8 bg-gray-800 rounded-xl border border-gray-700">
              <FileText size={64} className="text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Preview Not Available</h3>
              <p className="text-gray-400 mb-6 max-w-sm">
                No preview is available for {fileType.toUpperCase()} files. Please download to view.
              </p>
              <button 
                onClick={handleDownload}
                className="bg-primary px-6 py-3 rounded-lg font-semibold"
              >
                Download File
              </button>
           </div>
        )}
      </div>
    </>
  );
}
