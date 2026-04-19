import React from "react";
import RoleGuard from "@/components/layout/RoleGuard";

export default function AuditLogSettingsPage() {
  return (
    <RoleGuard allowedRoles={["owner"]}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agency Audit Logs</h2>
          <p className="text-sm text-gray-500 mt-1">Review immutably recorded transactions and compliance events.</p>
        </div>
        <div className="p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center text-gray-500">
          <p className="mb-2 font-medium">Coming Soon</p>
          <p className="text-sm">Comprehensive Audit Log trail visualization is under active development. Events are actively being logged in the backend and can be retrieved via direct querying if necessary.</p>
        </div>
      </div>
    </RoleGuard>
  );
}
