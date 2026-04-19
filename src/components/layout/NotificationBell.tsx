"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface INotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  entityUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.unreadCount);
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  // Visibility-aware polling
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const startPolling = () => {
      fetchNotifications(); // immediate
      intervalId = setInterval(fetchNotifications, 60_000); // every minute
    };

    const stopPolling = () => clearInterval(intervalId);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    };

    // Initial check
    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await fetch(`/api/notifications?action=mark_read&id=${id}`, { method: "PUT" });
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      await fetch("/api/notifications?action=mark_all_read", { method: "PUT" });
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-500 relative p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:text-primary/80 flex items-center">
                <CheckCircle2 size={14} className="mr-1"/> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No notifications to display.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map(notif => (
                  <div key={notif._id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${notif.isRead ? 'opacity-70' : 'bg-blue-50/50 dark:bg-blue-900/10'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <p className={`text-sm font-medium ${notif.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <button onClick={() => markRead(notif._id)} title="Mark as read" className="text-gray-400 hover:text-primary">
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {notif.message}
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>{new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      {notif.entityUrl && (
                        <Link href={notif.entityUrl} onClick={() => setIsOpen(false)} className="text-primary hover:underline">
                          View details
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-100 dark:border-gray-700 text-center">
            <Link href="/settings/notifications" className="text-xs font-medium text-primary hover:text-primary/80" onClick={() => setIsOpen(false)}>
              View all notification history
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
