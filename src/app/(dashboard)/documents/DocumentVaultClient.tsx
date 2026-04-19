"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Search, Filter, ShieldCheck, Share2, Download, Trash2, Clock, CheckCircle2, FileText, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface IDoc {
  _id: string;
  fileName: string;
  documentType: string;
  entityType: string;
  status: string;
  expiryDate?: string;
  sizeBytes: number;
  cloudinaryUrl: string;
  createdAt: string;
  shareLinks?: any[];
}

export default function DocumentVaultClient({ initialDocs }: { initialDocs: IDoc[] }) {
  const [docs, setDocs] = useState<IDoc[]>(initialDocs);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [shareModalDoc, setShareModalDoc] = useState<IDoc | null>(null);

  const filteredDocs = docs.filter(d => {
    const matchesSearch = d.fileName.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || d.entityType.toLowerCase() === filterType.toLowerCase() || d.status === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocs(docs.filter(d => d._id !== id));
        toast.success("Document deleted");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleGenerateShareLink = async (docId: string, hours: number) => {
    try {
      const res = await fetch(`/api/documents/${docId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInHours: hours, maxAccessCount: 3 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Secure link generated");
        navigator.clipboard.writeText(data.data.link);
        toast("Link copied to clipboard", { icon: <CheckCircle2 size={14} className="text-green-500" /> });
        setShareModalDoc(null);
        // We'd optimally re-fetch the specific doc to update state with the new link, but UX wise copying is enough.
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to generate link");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <ShieldCheck className="mr-2 text-primary" size={28} /> Document Vault
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">End-to-end encrypted storage for your agency.</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
          {/* Stats summary */}
          <div className="px-4 py-1 text-center border-r border-gray-300 dark:border-gray-700">
            <span className="block text-lg font-bold text-gray-900 dark:text-white">{docs.length}</span>
            <span className="block text-[10px] text-gray-500 uppercase font-medium">Total Docs</span>
          </div>
          <div className="px-4 py-1 text-center">
            <span className="block text-lg font-bold text-amber-600 dark:text-amber-500">
              {docs.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
            </span>
            <span className="block text-[10px] text-gray-500 uppercase font-medium">Expiring Soon</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search documents by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Filter className="text-gray-400 mt-2 hidden sm:block" size={18} />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
          >
            <option value="all">All Documents</option>
            <option value="expired">Expired</option>
            <option value="Policy">Policy Docs</option>
            <option value="Client">Client KYC</option>
            <option value="Claim">Claims</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Document</th>
                <th className="px-6 py-4 font-semibold">Related To</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Status / Expiry</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No documents found.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => {
                  const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                  const isExpiringSoon = !isExpired && doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                  return (
                    <tr key={doc._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FileText className="text-gray-400 mr-3 shrink-0" size={18} />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{doc.fileName}</p>
                            <p className="text-[10px] text-gray-500">{(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB • {format(new Date(doc.createdAt), "MMM d, yyyy")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {doc.entityType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 capitalize text-xs">
                        {doc.documentType.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4">
                        {doc.expiryDate ? (
                          <div className={`flex items-center text-xs font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-gray-600 dark:text-gray-400'}`}>
                            {isExpired ? <AlertCircle size={14} className="mr-1" /> : isExpiringSoon ? <Clock size={14} className="mr-1" /> : <CheckCircle2 size={14} className="mr-1 inline text-green-500" />}
                            {format(new Date(doc.expiryDate), "MMM d, yyyy")}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 font-medium whitespace-nowrap"><CheckCircle2 size={12} className="inline mr-1 text-green-500" /> Never expires</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => window.open(doc.cloudinaryUrl, '_blank')} className="p-1.5 text-gray-400 hover:text-primary transition" title="Preview securely">
                          <Download size={16} />
                        </button>
                        <button onClick={() => setShareModalDoc(doc)} className="p-1.5 text-gray-400 hover:text-green-500 transition" title="Secure Client Share">
                          <Share2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(doc._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {shareModalDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden border border-border">
            <div className="flex justify-between items-center p-4 border-b border-border bg-gray-50 dark:bg-gray-900/50">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Share2 size={18} className="mr-2 text-primary" /> Create Secure Link
              </h3>
              <button onClick={() => setShareModalDoc(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Generate a secure, single-use public link to share <span className="font-semibold text-gray-900 dark:text-white">{shareModalDoc.fileName}</span> with your client.
              </p>

              <div className="space-y-3">
                <button onClick={() => handleGenerateShareLink(shareModalDoc._id, 1)} className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-primary focus:ring-2 focus:ring-primary transition bg-gray-50 dark:bg-gray-800 group">
                  <div className="font-medium text-gray-900 dark:text-white flex items-center group-hover:text-primary transition">
                    <Clock size={16} className="mr-2 opacity-70" /> 1 Hour Access
                  </div>
                  <p className="text-xs text-gray-500 mt-1 pl-6">Highly secure, best for immediate WhatsApp viewing (max 3 opens).</p>
                </button>
                <button onClick={() => handleGenerateShareLink(shareModalDoc._id, 24)} className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-primary focus:ring-2 focus:ring-primary transition bg-gray-50 dark:bg-gray-800 group">
                  <div className="font-medium text-gray-900 dark:text-white flex items-center group-hover:text-primary transition">
                    <Clock size={16} className="mr-2 opacity-70" /> 24 Hours Access
                  </div>
                  <p className="text-xs text-gray-500 mt-1 pl-6">Standard secure sharing, expires tomorrow (max 3 opens).</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
