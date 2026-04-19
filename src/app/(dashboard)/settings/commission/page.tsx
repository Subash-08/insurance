import React from "react";
import RoleGuard from "@/components/layout/RoleGuard";

export default function CommissionSettingsPage() {
  return (
    <RoleGuard allowedRoles={["owner"]}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Global Commission Rates</h2>
          <p className="text-sm text-gray-500 mt-1">Configure default commission structures per policy type mapped to Insurers.</p>
        </div>
        <div className="p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center text-gray-500">
          <p className="mb-2 font-medium">Coming Soon</p>
          <p className="text-sm">Commission Rate builder is under active development. Meanwhile, settings apply uniformly or as defaults via API.</p>
        </div>
      </div>
    </RoleGuard>
  );
}
