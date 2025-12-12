"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarDays,
  Users,
  CreditCard,
  Ticket,
  Star,
  Flag,
  UserPlus,
  Briefcase,
} from "lucide-react";
import type { AppDispatch, RootState } from "@/lib/features";
import { fetchEvents } from "@/lib/features/eventSlice";
import { fetchUsers } from "@/lib/features/userSlice";
import { fetchOrders } from "@/lib/features/orderSlice";
import { fetchVenues } from "@/lib/features/venueSlice";
import { fetchReports } from "@/lib/features/reportsSlice";

export default function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const { events, loading: eventsLoading } = useSelector(
    (state: RootState) => state.events
  );
  const { users, loading: usersLoading } = useSelector(
    (state: RootState) => state.users
  );
  const { orders, loading: ordersLoading } = useSelector(
    (state: RootState) => state.orders
  );
  const { venues } = useSelector((state: RootState) => state.venues);
  const { items: reports, loading: reportsLoading } = useSelector(
    (state: RootState) => state.reports
  );

  useEffect(() => {
    dispatch(fetchEvents() as any);
    dispatch(fetchUsers() as any);
    dispatch(fetchOrders() as any);
    dispatch(fetchVenues() as any);
    dispatch(fetchReports() as any);
  }, [dispatch]);

  const confirmedOrders = orders?.filter((o: any) => o.status === "confirmed") || [];
  const totalRevenue = confirmedOrders.reduce(
    (sum: number, o: any) => sum + (Number(o.totalPrice) || 0),
    0
  );
  const totalTicketsSold = confirmedOrders.reduce(
    (sum: number, o: any) => sum + (Number(o.quantity) || 0),
    0
  );

  const hasStatusField = Array.isArray(events) && events.some((e: any) => e?.status);
  const totalBannedEvents = hasStatusField
    ? events.filter((e: any) => String(e.status).toLowerCase() === "banned").length
    : 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newUsersThisMonth = (users || []).filter((u: any) => {
    if (!u?.createdAt) return false;
    const created = new Date(u.createdAt);
    return created >= startOfMonth;
  }).length;
  const newOrganizersThisMonth = (users || []).filter((u: any) => {
    if (!u?.createdAt) return false;
    const created = new Date(u.createdAt);
    const isOrganizer = String(u?.role || "").toLowerCase() === "organizer";
    return isOrganizer && created >= startOfMonth;
  }).length;

  const isStatsLoading = eventsLoading || usersLoading || ordersLoading || reportsLoading;

  const eventsPerVenueMap: Record<string, number> = {};
  (events || []).forEach((e: any) => {
    const venueId =
      e?.venueData?.id ||
      e?.venue ||
      e?.venueId ||
      undefined;
    const venueFromStore = venueId
      ? (venues || []).find((v: any) => v.id === venueId)
      : undefined;
    const label =
      venueFromStore?.title ||
      e?.venueData?.name ||
      e?.venueData?.title ||
      venueId ||
      "Unknown venue";
    const key = String(label || "Unknown venue");
    eventsPerVenueMap[key] = (eventsPerVenueMap[key] || 0) + 1;
  });

  const venueEntries = Object.entries(eventsPerVenueMap).map(
    ([label, value]) => ({ label, value })
  );

  venueEntries.sort((a, b) => b.value - a.value);

  const topVenues = venueEntries.slice(0, 8);
  const maxVenueCount = topVenues.reduce(
    (max, entry) => (entry.value > max ? entry.value : max),
    0
  );

  const isVenuesLoading = eventsLoading;

  const upcomingEvents = (events || [])
    .map((e: any) => {
      const raw = e?.startDate;
      let date: Date | null = null;
      if (!raw) {
        date = null;
      } else if (raw instanceof Date) {
        date = raw;
      } else if (typeof raw === "string") {
        date = new Date(raw);
      } else if (typeof raw === "object" && typeof (raw as any).toDate === "function") {
        date = (raw as any).toDate();
      }
      return { ...e, __startDate: date };
    })
    .filter((e: any) => e.__startDate && e.__startDate > new Date())
    .sort((a: any, b: any) => (a.__startDate as Date).getTime() - (b.__startDate as Date).getTime())
    .slice(0, 4);

  const upcomingEventsCount = (events || []).filter((e: any) => {
    const raw = e?.startDate;
    let date: Date | null = null;
    if (!raw) return false;
    if (raw instanceof Date) {
      date = raw;
    } else if (typeof raw === "string") {
      date = new Date(raw);
    } else if (typeof raw === "object" && typeof (raw as any).toDate === "function") {
      date = (raw as any).toDate();
    }
    return !!date && date > new Date();
  }).length;

  const formatRelativeTime = (date: Date | null) => {
    if (!date) return "Date not available";
    const nowTime = Date.now();
    const diffMs = date.getTime() - nowTime;
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    if (diffMinutes <= 0) return "Starting soon";
    if (diffMinutes < 60) return `In ${diffMinutes} minutes`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `In ${diffHours} hours`;
    const diffDays = Math.round(diffHours / 24);
    return `In ${diffDays} days`;
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-72 flex-col gap-3">
              <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-primary dark:text-white">
                Super Admin Dashboard
              </p>
              <p className="text-base font-normal text-neutral-400">
                Welcome back, Alex! Here's the platform-wide overview.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg border border-primary px-5 text-base font-bold tracking-[0.015em] text-primary hover:bg-primary/10 dark:text-white dark:hover:bg-primary/20 sm:w-auto">
                <CalendarDays className="h-5 w-5" />
                <span className="truncate">View All Events</span>
              </button>
              <button className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-5 text-base font-bold tracking-[0.015em] text-white hover:bg-blue-800 sm:w-auto">
                <Users className="h-5 w-5" />
                <span className="truncate">Manage Users</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Events Card */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-neutral-400">
                    Total Events
                  </p>
                  <p className="mt-2 text-4xl font-bold text-primary dark:text-white">
                    {isStatsLoading ? "..." : (events?.length || 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
                  <CalendarDays className="h-6 w-6 text-orange-600 dark:text-orange-300" />
                </div>
              </div>
              <p className="mt-4 text-sm text-neutral-400">
                Upcoming events:{" "}
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {isStatsLoading ? "..." : upcomingEventsCount.toLocaleString()}
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-neutral-400">
                    Total Platform Revenue
                  </p>
                  <p className="mt-2 text-4xl font-bold text-primary dark:text-white">
                    {isStatsLoading
                      ? "..."
                      : `$${totalRevenue.toLocaleString()}`}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                  <CreditCard className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
              <p className="mt-4 text-sm text-neutral-400">
                Total sold tickets:{" "}
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {isStatsLoading ? "..." : totalTicketsSold.toLocaleString()}
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-neutral-400">
                    Banned Events
                  </p>
                  <p className="mt-2 text-4xl font-bold text-primary dark:text-white">
                    {isStatsLoading ? "..." : totalBannedEvents.toLocaleString()}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                  <Ticket className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-neutral-400">
                <p>
                  Total reports:{" "}
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {isStatsLoading ? "..." : reports?.length?.toLocaleString() || '0'}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-neutral-400">
                    New Users This Month
                  </p>
                  <p className="mt-2 text-4xl font-bold text-primary dark:text-white">
                    {isStatsLoading ? "..." : newUsersThisMonth.toLocaleString()}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/40">
                  <UserPlus className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                </div>
              </div>
              <p className="mt-4 text-sm text-neutral-400">
                Organizers this month:{" "}
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {isStatsLoading ? "..." : newOrganizersThisMonth.toLocaleString()}
                </span>
              </p>
            </div>
          </div>

          {/* Charts + Activity */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Events per Venue
                </h2>
                <div className="flex items-center gap-2 rounded-lg bg-neutral-100 p-1 text-sm dark:bg-neutral-800">
                  <button className="rounded-md bg-white px-3 py-1 font-semibold text-primary shadow-sm dark:bg-neutral-700 dark:text-white">
                    Last 30 Days
                  </button>
                  <button className="rounded-md px-3 py-1 font-medium text-neutral-500 hover:text-primary dark:text-neutral-400 dark:hover:text-white">
                    Last 90 Days
                  </button>
                  <button className="rounded-md px-3 py-1 font-medium text-neutral-500 hover:text-primary dark:text-neutral-400 dark:hover:text-white">
                    All Time
                  </button>
                </div>
              </div>

              <div className="mt-6 h-80 w-full border-b border-neutral-200 pb-4 dark:border-neutral-700 overflow-x-auto">
                <div className="flex h-full min-w-max items-end justify-start gap-6 px-4">
                  {isVenuesLoading && (
                    <p className="text-sm text-neutral-400">
                      Loading events per venue...
                    </p>
                  )}

                  {!isVenuesLoading && topVenues.length === 0 && (
                    <p className="text-sm text-neutral-400">
                      No venue data available yet.
                    </p>
                  )}

                  {!isVenuesLoading &&
                    topVenues.length > 0 &&
                    topVenues.map((entry) => {
                      const heightPercent =
                        maxVenueCount > 0
                          ? `${Math.max(10, Math.round((entry.value / maxVenueCount) * 100))}%`
                          : "10%";
                      return (
                        <div
                          key={entry.label}
                          className="flex h-full w-16 flex-col items-center justify-end gap-2 sm:w-20 md:w-24"
                        >
                          <div
                            className="flex w-full items-end justify-center rounded-t-lg bg-primary"
                            style={{ height: heightPercent }}
                            title={`${entry.label}: ${entry.value} events`}
                          ></div>
                          <p className="text-xs font-medium text-neutral-400 text-center truncate max-w-full">
                            {entry.label}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Platform-wide Activity
                </h2>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/60 dark:text-green-200">
                  {eventsLoading ? "..." : `${upcomingEventsCount.toLocaleString()} upcoming`}
                </span>
              </div>
              <ul className="mt-4 space-y-4">
                {eventsLoading && (
                  <li className="text-sm text-neutral-400">Loading upcoming events...</li>
                )}

                {!eventsLoading && upcomingEvents.length === 0 && (
                  <li className="text-sm text-neutral-400">
                    No upcoming events found.
                  </li>
                )}

                {!eventsLoading &&
                  upcomingEvents.map((event: any, index: number) => (
                    <li key={event.id || index} className="flex items-start gap-4">
                      <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                        <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          Upcoming Event
                        </p>
                        <p className="text-sm text-neutral-400">
                          "{event.title || "Untitled Event"}" by {event.organizerName || event.organizerId || "Unknown organizer"}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          {formatRelativeTime(event.__startDate as Date | null)}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
