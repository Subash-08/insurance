"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Shield, ShieldQuestion, UserX, X, HeartPulse, Car, Target } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface CrossSellClient {
  _id: string;
  fullName: string;
  phone: string;
  agentName: string;
  policyTypes: string[];
}

interface CrossSellData {
  lifeNotHealth: CrossSellClient[];
  vehicleNotLife: CrossSellClient[];
  healthNotLife: CrossSellClient[];
  noInsurance: CrossSellClient[];
  totalOpportunities: number;
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function CrossSellWidget() {
  const [data, setData] = useState<CrossSellData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSheet, setActiveSheet] = useState<keyof Omit<CrossSellData, "totalOpportunities"> | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/cross-sell")
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d.data);
      })
      .catch(() => toast.error("Failed to load opportunities"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!data) return null;

  const buckets = [
    {
      id: "lifeNotHealth" as const,
      title: "Has Life, No Health",
      count: data.lifeNotHealth.length,
      icon: HeartPulse,
      bg: "bg-rose-50 dark:bg-rose-900/20",
      iconColor: "text-rose-600 dark:text-rose-400",
      suggestedType: "health",
    },
    {
      id: "vehicleNotLife" as const,
      title: "Has Vehicle, No Life",
      count: data.vehicleNotLife.length,
      icon: Car,
      bg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      suggestedType: "life",
    },
    {
      id: "healthNotLife" as const,
      title: "Has Health, No Life",
      count: data.healthNotLife.length,
      icon: Shield,
      bg: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
      suggestedType: "life",
    },
    {
      id: "noInsurance" as const,
      title: "No Policies Yet",
      count: data.noInsurance.length,
      icon: UserX,
      bg: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      suggestedType: "life",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {buckets.map((b) => (
          <div
            key={b.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center text-center transition-all duration-200 shadow-sm"
          >
            <div className={`w-12 h-12 rounded-full ${b.bg} flex items-center justify-center mb-3`}>
              <b.icon className={`w-6 h-6 ${b.iconColor}`} />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{b.title}</h4>
            <p className="text-xs text-gray-500 mb-4">{b.count} Clients</p>
            <button
              onClick={() => setActiveSheet(b.id)}
              disabled={b.count === 0}
              className="w-full py-1.5 px-3 text-xs font-medium rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              View List
            </button>
          </div>
        ))}
      </div>

      {/* Sheet Modal */}
      {activeSheet && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {buckets.find((b) => b.id === activeSheet)?.title}
              </h3>
              <button
                onClick={() => setActiveSheet(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {data[activeSheet].map((client) => {
                  const bucketInfo = buckets.find((b) => b.id === activeSheet);
                  return (
                    <div
                      key={client._id}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{client.fullName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{client.phone} • {client.agentName}</p>
                        </div>
                        <Link
                          href={`/leads/new?clientId=${client._id}&suggestedType=${bucketInfo?.suggestedType}&source=cross_sell`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          <Target className="w-3.5 h-3.5" />
                          Start Lead
                        </Link>
                      </div>
                      {client.policyTypes.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {client.policyTypes.map((pt, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              {pt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
