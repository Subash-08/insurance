import React from "react";
import RoleGuard from "@/components/layout/RoleGuard";

export default function AgencySettingsPage() {
  return (
    <RoleGuard allowedRoles={["owner"]}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agency Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Configure your agency details, logo, and public presence.</p>
        </div>
        <div className="p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center text-gray-500">
          <p className="mb-2 font-medium">Coming Soon</p>
          <p className="text-sm">Agency Settings module is under active development.</p>
        </div>
      </div>
    </RoleGuard>
  );
}
