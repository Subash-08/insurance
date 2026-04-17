"use client";

import { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { buildWhatsAppUrl, WHATSAPP_MESSAGE_TEMPLATES, generateWaLink } from "@/lib/whatsapp";

interface Props {
  phone: string;
  templateKey: string;
  initialVariables: Record<string, string>;
  onClose: () => void;
}

export default function WhatsAppShareModal({ phone, templateKey: initialKey, initialVariables, onClose }: Props) {
  const [selectedKey, setSelectedKey] = useState(initialKey);
  const [editedMessage, setEditedMessage] = useState(() => {
    const fn = WHATSAPP_MESSAGE_TEMPLATES[initialKey];
    return fn ? fn(initialVariables) : initialVariables.customMessage || "";
  });
  const [copied, setCopied] = useState(false);

  const templateKeys = Object.keys(WHATSAPP_MESSAGE_TEMPLATES);

  const onTemplateChange = (key: string) => {
    setSelectedKey(key);
    const fn = WHATSAPP_MESSAGE_TEMPLATES[key];
    if (fn) setEditedMessage(fn(initialVariables));
  };

  const waUrl = generateWaLink(phone, editedMessage);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(editedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Send WhatsApp Message</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1"><X size={20} /></button>
        </div>

        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-400 font-medium">
          📱 Sending to: {phone || "No phone number"}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Template</label>
          <select
            value={selectedKey}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none"
          >
            {templateKeys.map((k) => (
              <option key={k} value={k}>{k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">Message</label>
            <span className="text-xs text-gray-400">{editedMessage.length} chars</span>
          </div>
          <textarea
            rows={6}
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>

        <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
          ℹ️ This opens WhatsApp on your device or WhatsApp Web. The message is pre-filled but you must press <strong>Send</strong> in WhatsApp.
        </p>

        <div className="flex gap-3">
          <button
            onClick={copyMessage}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {copied ? <><Check size={14} className="text-green-500" /> Copied!</> : <><Copy size={14} /> Copy</>}
          </button>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.524 5.849L0 24l6.278-1.499A11.964 11.964 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.88 0-3.637-.497-5.152-1.367l-.37-.219-3.727.89.937-3.595-.24-.37A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Open WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
