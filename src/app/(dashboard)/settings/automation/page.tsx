import React from "react";
import RoleGuard from "@/components/layout/RoleGuard";

export default function AutomationSettingsPage() {
  return (
    <RoleGuard allowedRoles={["owner"]}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Automation Hub (n8n)</h2>
          <p className="text-sm text-gray-500 mt-1">Configure Webhook URLs and secret keys to pipe insurance workflows to n8n.</p>
        </div>
        <div className="p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center text-gray-500">
          <p className="mb-2 font-medium">Coming Soon</p>
          <p className="text-sm">n8n Automation mapper is under active development. Ensure `N8N_WEBHOOK_SECRET` is set in your internal environment for current active webhook endpoints.</p>
        </div>
      </div>
    </RoleGuard>
  );
}
