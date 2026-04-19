"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Shield, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfileClient() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/profile");
        const json = await res.json();
        if (json.success) setProfile(json.data);
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone
        })
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success("Profile updated successfully");
        setProfile(json.data);
      } else {
        toast.error(json.error || "Update failed");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center border border-border shadow-sm rounded-xl bg-white dark:bg-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="px-6 py-8 sm:p-10 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center shrink-0 border border-primary/20">
              <span className="text-3xl font-bold text-primary">
                {profile.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
              <p className="text-gray-500 font-medium capitalize mt-1 text-sm flex items-center">
                 <Shield className="w-4 h-4 mr-1 text-primary/70" />
                 {profile.role} User
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" /> Full Name
                </label>
                <input
                  type="text"
                  value={profile.name || ""}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" /> Email Address
                </label>
                <input
                  type="email"
                  value={profile.email || ""}
                  disabled
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-70"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" /> Phone Number
                </label>
                <input
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition drop-shadow-sm"
              >
                {saving ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
