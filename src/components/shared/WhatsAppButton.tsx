"use client";

import { buildWhatsAppUrl } from "@/lib/whatsapp";

const WA_ICON = (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.524 5.849L0 24l6.278-1.499A11.964 11.964 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.88 0-3.637-.497-5.152-1.367l-.37-.219-3.727.89.937-3.595-.24-.37A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

interface Props {
  phone: string;
  templateKey: string;
  variables: Record<string, string>;
  label?: string;
  variant?: "icon" | "button" | "menu-item";
  size?: "sm" | "md";
}

export default function WhatsAppButton({
  phone,
  templateKey,
  variables,
  label = "WhatsApp",
  variant = "button",
  size = "md",
}: Props) {
  if (!phone) {
    if (variant === "icon") {
      return (
        <span title="No phone number on file" className="opacity-30 cursor-not-allowed inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
          {WA_ICON}
        </span>
      );
    }
    return (
      <span title="No phone number on file" className="opacity-30 cursor-not-allowed inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-green-300 text-green-700">
        {WA_ICON} {label}
      </span>
    );
  }

  const url = buildWhatsAppUrl(templateKey, variables, phone);

  if (variant === "icon") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={label}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
      >
        {WA_ICON}
      </a>
    );
  }

  if (variant === "menu-item") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full">
        {WA_ICON} {label}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors
        ${size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"}`}
    >
      {WA_ICON} {label}
    </a>
  );
}
