"use client";

import { useState, useEffect, useRef } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase/config";

import type { AppDispatch, RootState } from "@/lib/features";
import { fetchOrders } from "@/lib/features/orderSlice";

interface NavNotificationsProps {
  userId?: string;
  lang: "en" | "ar";
  scrolled: boolean;
  transparent: boolean;
}

export default function NavNotifications({
  userId,
  lang,
  scrolled,
  transparent,
}: NavNotificationsProps) {
  const { t } = useTranslation("common");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { orders } = useSelector((state: RootState) => state.orders);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const [readReminderOrderIds, setReadReminderOrderIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationIds, setUnreadNotificationIds] = useState<string[]>([]);

  // Load read reminder IDs from localStorage per user
  useEffect(() => {
    if (!userId) {
      setReadReminderOrderIds([]);
      return;
    }

    try {
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(`read_reminder_orders_${userId}`)
          : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setReadReminderOrderIds(parsed as string[]);
        }
      }
    } catch {
      // ignore
    }
  }, [userId]);

  // Fetch orders for this user (used only for reminders)
  useEffect(() => {
    if (!userId) return;
    dispatch(fetchOrders(userId));
  }, [dispatch, userId]);

  // Subscribe to in-app event update notifications for this user
  useEffect(() => {
    if (!userId) return;
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        const sorted = items.sort((a, b) => {
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          return tb - ta;
        });
        setNotifications(sorted);
        setUnreadNotificationIds(sorted.filter((n) => !n.read).map((n) => n.id));
      });
      return () => unsub();
    } catch {
      // ignore
    }
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!notificationsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

  const now = new Date();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

  const reminderOrders =
    orders?.filter((order) => {
      if (!order.isUpcoming || !order.eventData?.date) return false;
      const eventDate = new Date(order.eventData.date);
      const diff = eventDate.getTime() - now.getTime();
      return diff > 0 && diff <= twoDaysMs;
    }) ?? [];

  const remindersCount = reminderOrders.length;

  const unreadReminderOrders = reminderOrders.filter(
    (order) => !readReminderOrderIds.includes(order.id)
  );
  const unreadRemindersCount = unreadReminderOrders.length;
  const unreadUpdatesCount = unreadNotificationIds.length;
  const totalUnreadCount = unreadRemindersCount + unreadUpdatesCount;

  if (!userId) return null;

  return (
    <div ref={notificationsRef} className="relative group flex items-center">
      <button
        type="button"
        onClick={() => {
          const next = !notificationsOpen;

          if (next && reminderOrders.length > 0 && userId) {
            const allIds = Array.from(
              new Set([
                ...readReminderOrderIds,
                ...reminderOrders.map((o) => o.id),
              ])
            );

            setReadReminderOrderIds(allIds);

            try {
              if (typeof window !== "undefined") {
                window.localStorage.setItem(
                  `read_reminder_orders_${userId}`,
                  JSON.stringify(allIds)
                );
              }
            } catch {
              // ignore
            }
          }

          if (next && userId && unreadNotificationIds.length > 0) {
            const idsToMark = [...unreadNotificationIds];
            Promise.all(
              idsToMark.map((id) =>
                updateDoc(doc(db, "notifications", id), {
                  read: true,
                  updatedAt: new Date().toISOString(),
                })
              )
            ).catch(() => {});
            setUnreadNotificationIds([]);
          }

          setNotificationsOpen(next);
        }}
        className={`relative p-2 rounded-full transition-transform duration-200 transform group-hover:scale-110 ${
          scrolled || !transparent
            ? "text-primary hover:bg-primary-50"
            : "text-white hover:bg-white/10"
        }`}
      >
        <BellIcon className="w-7 h-7" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-1">
            {totalUnreadCount}
          </span>
        )}
      </button>
      <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 scale-0 opacity-0 group-hover:opacity-100 group-hover:scale-100 bg-primary-600 text-white text-xs font-medium py-1 px-3 rounded-md shadow-md whitespace-nowrap transition-all duration-200">
        {t("nav.notifications")}
      </span>

      {notificationsOpen && (
        <div
          className="absolute top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 left-1/2 -translate-x-1/2 origin-top"
        >
          {remindersCount === 0 && notifications.length === 0 ? (
            <p className="px-4 py-2 text-sm text-gray-500">{t("nav.noNotifications")}</p>
          ) : (
            <>
              {notifications.length > 0 && (
                <>
                  <p className="px-4 pb-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                    {t("nav.eventUpdates")}
                  </p>
                  <ul className="max-h-64 overflow-y-auto">
                    {notifications.slice(0, 10).map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => {
                            router.push("/orders");
                            setNotificationsOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-primary-50 hover:text-primary text-sm flex flex-col"
                        >
                          <span className="font-medium truncate">{n.title || "Event updated"}</span>
                          <span className="text-xs text-gray-500">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</span>
                          {n.message && <span className="text-xs text-gray-600 truncate">{n.message}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {remindersCount > 0 && (
                <>
                  <p className="px-4 pb-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                    {t("nav.upcomingEvents")}
                  </p>
                  <ul className="max-h-64 overflow-y-auto">
                    {reminderOrders.map((order) => (
                      <li key={order.id}>
                        <button
                          type="button"
                          onClick={() => {
                            router.push("/orders");
                            setNotificationsOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-primary-50 hover:text-primary text-sm flex flex-col"
                        >
                          <span className="font-medium truncate">{order.eventName}</span>
                          <span className="text-xs text-gray-500">
                            {order.eventData?.date
                              ? new Date(order.eventData.date).toLocaleString()
                              : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
