"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Phone, Mail, MapPin, User, ChevronLeft, Send, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { generateWaLink } from "@/lib/whatsapp";

export default function LeadDetailClient({ lead }: { lead: any }) {
  const router = useRouter();
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optimistic UI for notes
  const [notes, setNotes] = useState(
    lead.followUpNotes?.sort((a: any, b: any) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()) || []
  );

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${lead._id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteText }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes([{ text: noteText, addedAt: new Date().toISOString(), addedBy: "me" }, ...notes]);
        setNoteText("");
        toast.success("Note added");
      } else {
        toast.error(data.message || "Failed to add note");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvert = async () => {
    try {
      const res = await fetch(`/api/leads/${lead._id}/convert`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Use sessionStorage to pass prefill data to client creation page, or URL params
        const params = new URLSearchParams(data.data).toString();
        router.push(`/clients/new?${params}`);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to start convert flow");
    }
  };

  const handleMarkLost = async () => {
    const reason = window.prompt("Reason for losing this lead?");
    if (reason === null) return;
    
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "lost", lostReason: reason }),
      });
      if (res.ok) {
        toast.success("Lead marked as lost");
        router.refresh();
      }
    } catch {
      toast.error("Failed to update stage");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Back & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/leads" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
          <ChevronLeft size={16} className="mr-1" /> Back to Pipeline
        </Link>
        <div className="flex flex-wrap gap-2">
          {lead.stage !== "won" && lead.stage !== "lost" && (
            <>
              <button 
                onClick={handleMarkLost}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-border shadow-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition flex items-center"
              >
                <XCircle size={16} className="mr-2 text-gray-400" /> Mark Lost
              </button>
              <button 
                onClick={handleConvert}
                className="px-4 py-2 bg-primary text-white shadow-sm rounded-lg hover:bg-primary/90 text-sm font-medium transition flex items-center"
              >
                <CheckCircle2 size={16} className="mr-2" /> Convert to Client
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Timeline & Notes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-border shadow-sm rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Follow-up Notes</h2>
            
            <form onSubmit={handleAddNote} className="mb-6 relative">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Log a call, meeting, or observation..."
                className="w-full rounded-lg border border-border bg-gray-50 dark:bg-gray-800 px-4 py-3 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-gray-200 resize-none"
              />
              <div className="absolute right-3 bottom-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { const url = generateWaLink(lead.phone, `Hi ${lead.fullName},`); if (url) window.open(url, "_blank"); }}
                  className="p-1.5 text-gray-400 hover:text-green-500 rounded transition bg-white dark:bg-gray-700 shadow-sm border border-border"
                  title="WhatsApp"
                >
                  <Phone size={14} />
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !noteText.trim()}
                  className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded shadow transition hover:bg-primary/90 disabled:opacity-50 flex items-center"
                >
                  <Send size={12} className="mr-1" /> Log Note
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-sm text-center py-4 text-gray-500 italic">No notes recorded yet. Start logging interactions.</p>
              ) : (
                notes.map((note: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                        <User size={14} className="text-blue-600 dark:text-blue-300" />
                      </div>
                      {i !== notes.length - 1 && <div className="w-px h-full bg-gray-200 dark:bg-gray-700 my-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-border">
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{note.text}</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">
                          {format(new Date(note.addedAt), "MMM d, yyyy • h:mm a")} 
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Profile & Analytics */}
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-gray-900 border border-border shadow-sm rounded-xl p-6">
             <div className="flex items-center space-x-3 mb-4">
               <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                 {lead.fullName.charAt(0)}
               </div>
               <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">{lead.fullName}</h2>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                    lead.stage === 'won' ? 'bg-green-100 text-green-700' :
                    lead.stage === 'lost' ? 'bg-gray-200 text-gray-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {lead.stage.replace('_', ' ')}
                  </span>
               </div>
             </div>

             <div className="space-y-3 mt-6 border-t border-border pt-4">
               <div className="flex items-start">
                  <Phone size={16} className="text-gray-400 mt-0.5 mr-3 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Phone</p>
                    <p className="text-sm text-gray-900 dark:text-gray-200">{lead.phone}</p>
                  </div>
               </div>
               
               {lead.email && (
                 <div className="flex items-start">
                    <Mail size={16} className="text-gray-400 mt-0.5 mr-3 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Email</p>
                      <p className="text-sm text-gray-900 dark:text-gray-200">{lead.email}</p>
                    </div>
                 </div>
               )}
               
               {(lead.city || lead.state) && (
                 <div className="flex items-start">
                    <MapPin size={16} className="text-gray-400 mt-0.5 mr-3 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Location</p>
                      <p className="text-sm text-gray-900 dark:text-gray-200">{[lead.city, lead.state].filter(Boolean).join(", ")}</p>
                    </div>
                 </div>
               )}
             </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 border border-border shadow-sm rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Pipeline Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-border">
                <p className="text-[10px] text-gray-500 uppercase font-medium">Priority</p>
                <p className="text-sm font-semibold capitalize text-gray-900 dark:text-white">{lead.priority}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-border">
                <p className="text-[10px] text-gray-500 uppercase font-medium">Est. Value</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {lead.estimatedSumAssured ? `₹${(lead.estimatedSumAssured / 100000).toFixed(1)}L` : "--"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-border col-span-2">
                <div className="flex items-center">
                  <Calendar size={14} className="text-gray-400 mr-2" />
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-medium">Last Contacted</p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      {lead.lastContactedAt ? format(new Date(lead.lastContactedAt), "MMM d, yyyy") : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {lead.interestedIn && lead.interestedIn.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] text-gray-500 uppercase font-medium mb-2">Interested In</p>
                <div className="flex flex-wrap gap-1">
                  {lead.interestedIn.map((item: string, i: number) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                      {item.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}
