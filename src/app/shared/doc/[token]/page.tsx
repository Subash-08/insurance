import React from "react";
import dbConnect from "@/lib/mongodb";
import Document from "@/models/Document";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import DocumentViewerClient from "./DocumentViewerClient";

export const metadata: Metadata = {
  title: "Secure Document Viewer | InsureFlow",
};

export default async function SharedDocumentPage({ params }: { params: { token: string } }) {
  // Public route. Verify token validity directly inside the page to prevent unnecessary API overhead for initial load.
  await dbConnect();

  const doc = await Document.findOne({ "shareLinks.token": params.token }).lean() as any;
  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
         <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-border text-center max-w-md w-full">
            <h1 className="text-xl font-bold text-red-600 mb-2">Link Invalid or Expired</h1>
            <p className="text-gray-600 dark:text-gray-400">The document you are trying to access is no longer available.</p>
         </div>
      </div>
    );
  }

  const shareLink = doc.shareLinks.find((sl: any) => sl.token === params.token);
  if (!shareLink || shareLink.isRevoked || new Date() > new Date(shareLink.expiresAt) || shareLink.accessCount >= shareLink.maxAccessCount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
         <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-border text-center max-w-md w-full">
            <h1 className="text-xl font-bold text-red-600 mb-2">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-400">This link has been revoked or has exceeded its access limits.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 h-16 shrink-0 flex items-center px-6 justify-between">
        <div className="text-white font-bold text-lg">InsureFlow Secure Vault</div>
        <div className="text-xs text-gray-400 flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" />
          End-to-End Encrypted Link
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden flex flex-col p-4 sm:p-8">
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700 flex-1 flex flex-col relative w-full max-w-5xl mx-auto">
          <DocumentViewerClient 
             token={params.token} 
             fileName={doc.fileName} 
             fileType={doc.fileType} 
             mimeType={doc.mimeType} 
             sizeBytes={doc.sizeBytes} 
          />
        </div>
      </main>
    </div>
  );
}
