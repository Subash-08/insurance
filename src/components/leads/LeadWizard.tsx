"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

const leadSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().regex(/^[0-9]{10}$/, "Must be a valid 10-digit number"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  source: z.string().optional(),
  productInterest: z.string().optional(),
  estimatedPremium: z.coerce.number().min(0).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function LeadWizard() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      source: "other",
      productInterest: "health",
      estimatedPremium: 0,
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      const formattedData = {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || undefined,
        source: data.source,
        productInterest: data.productInterest,
        estimatedPremium: data.estimatedPremium ? data.estimatedPremium * 100 : undefined, // Convert to paise
        stage: "new_inquiry",
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });

      const responseData = await res.json();

      if (responseData.success) {
        toast.success("Lead created successfully!");
        router.push(`/leads/${responseData.data._id}`);
      } else {
        if (responseData.error && Array.isArray(responseData.error)) {
           toast.error(responseData.error[0].message);
        } else {
           toast.error(responseData.error || "Failed to create lead");
        }
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-border p-6 max-w-3xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-border pb-2">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <input
                type="text"
                {...register("fullName")}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="John Doe"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
              <input
                type="text"
                {...register("phone")}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="9876543210"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (Optional)</label>
              <input
                type="email"
                {...register("email")}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="john@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>
        </div>

        {/* Lead Context */}
        <div className="pt-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-border pb-2">Lead Context</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
              <select
                {...register("source")}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="referral">Referral</option>
                <option value="website">Website Lead</option>
                <option value="social_media">Social Media</option>
                <option value="cold_call">Cold Call</option>
                <option value="walk_in">Walk-In</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Interest</label>
              <select
                {...register("productInterest")}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="health">Health Insurance</option>
                <option value="motor">Motor Insurance</option>
                <option value="life">Life Insurance</option>
                <option value="general">General Insurance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Premium (₹)</label>
              <input
                type="number"
                {...register("estimatedPremium")}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
            ) : (
              <>Save Lead <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
