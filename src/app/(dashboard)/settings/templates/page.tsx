import React from "react";
import { FileText } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

export default function PolicyTemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <FileText className="mr-2" size={24} />
          Policy Templates
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create and manage templates to pre-fill standard policy details, saving your team time when logging new policies.
        </p>
      </div>

      <div className="mt-8">
        <EmptyState 
          title="No templates found"
          description="Policy templates allow you to pre-configure coverage amounts, riders, and premiums for popular plans."
          ctaLabel="Feature Coming Soon"
          ctaHref="#"
        />
      </div>
    </div>
  );
}
