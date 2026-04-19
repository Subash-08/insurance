"use client";

import React, { useState } from "react";
import { X, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "Client" | "Policy" | "Claim" | "Lead";
  entityId: string;
  onUploadSuccess: () => void;
}

export default function DocumentUploadModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  onUploadSuccess,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("identity");
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be under 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId);
      formData.append("documentType", documentType);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success("Document uploaded successfully");
        setFile(null);
        setDocumentType("other");
        onUploadSuccess();
        onClose();
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (err) {
      toast.error("Network error during upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <UploadCloud className="mr-2 text-primary" size={20} /> Upload Document
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="identity">PAN / Aadhaar / Passport (Identity)</option>
              <option value="address">Address Proof</option>
              <option value="income_proof">Income Proof</option>
              <option value="medical">Medical Report</option>
              <option value="proposal_form">Proposal Form</option>
              <option value="policy_schedule">Policy Schedule</option>
              <option value="receipt">Premium Receipt</option>
              <option value="rc_book">RC Book</option>
              <option value="previous_policy">Previous Policy</option>
              <option value="claim_form">Claim Form</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select File</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition relative">
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                  <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                    <span>{file ? file.name : "Click to upload a file"}</span>
                    <input type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  {file ? `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF, PNG, JPG up to 10MB"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 transition">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md flex items-center"
          >
            {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
