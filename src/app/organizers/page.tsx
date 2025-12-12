"use client";

import RevenuePieChart from "@/components/RevenuePieChart";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  Users,
  CreditCard,
  Ticket,
  Star,
  Flag,
  Briefcase,
  Eye,
} from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/lib/features";
import { fetchOrganizerAnalytics } from "@/lib/features/analyticsSlice";
import Link from "next/link";
import Spinner from "@/components/Spinner";

export default function OrganizerAnalytics() {
  const { t } = useTranslation("common");
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useSelector((state: RootState) => state.users);
  const {
    revenueByCategory,
    totalTickets,
    totalEvents,
    topSellingEvents,
    upcomingEvents,
    totalCheckIns,
    attendanceRate,
    loading,
  } = useSelector((state: RootState) => state.analytics);

  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchOrganizerAnalytics(currentUser.id));
    }
  }, [currentUser, dispatch]);
  const hasAnyData =
    Object.keys(revenueByCategory || {}).length > 0 ||
    (topSellingEvents && topSellingEvents.length > 0) ||
    totalTickets > 0 ||
    totalEvents > 0;

  if (loading && !hasAnyData) {
    return (
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-72 flex-col gap-3">
                <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-primary dark:text-white">
                  {t("organizer_analytics.title")}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center min-h-[60vh]">
              <Spinner size="h-10 w-10" padding="py-0" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const totalRevenue = Object.values(revenueByCategory || {}).reduce(
    (sum, n) => sum + (Number(n) || 0),
    0
  );

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-72 flex-col gap-3">
              <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-primary dark:text-white">
                {t("organizer_analytics.title")}
              </p>
              <p className="text-base font-normal text-neutral-400">
                {t("organizer_analytics.subtitle")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/organizers/events"
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg border border-primary px-5 text-base font-bold tracking-[0.015em] text-primary hover:bg-primary/10 dark:text-white dark:hover:bg-primary/20 sm:w-auto"
              >
                <CalendarDays className="h-5 w-5" />
                <span className="truncate">
                  {t("organizer_analytics.view_all_events")}
                </span>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Platform Revenue */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-neutral-400">
                    {t("organizer_analytics.total_platform_revenue")}
                  </p>
                  <p className="mt-2 text-4xl font-bold text-primary dark:text-white">
                    {loading ? "—" : `$${totalRevenue.toLocaleString()}`}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                  <CreditCard className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
              <p className="mt-4 text-sm text-neutral-400">
                <span className="font-semibold text-green-600 dark:text-green-400">
                  +9.8%
                </span>{" "}
                {t("organizer_analytics.vs_last_month")}
              </p>
            </div>

            {/* Total Tickets Sold */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-neutral-400">
                    {t("organizer_analytics.total_tickets_sold")}
                  </p>
                  <p className="mt-2 text-4xl font-bold text-primary dark:text-white">
                    {loading ? "—" : totalTickets.toLocaleString()}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/40">
                  <Ticket className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                </div>
              </div>
              <p className="mt-4 text-sm text-neutral-400">
                <span className="font-semibold text-green-600 dark:text-green-400">
                  +8%
                </span>{" "}
                {t("organizer_analytics.vs_last_month")}
              </p>
            </div>

            {/* Total Events */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-neutral-400">
                    {t("organizer_analytics.total_events")}
                  </p>
                  <p className="mt-2 text-4xl font-bold text-primary dark:text-white">
                    {loading ? "—" : totalEvents.toLocaleString()}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                  <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
              <p className="mt-4 text-sm text-neutral-400">
                <span className="font-semibold text-green-600 dark:text-green-400">
                  +12%
                </span>{" "}
                {t("organizer_analytics.vs_last_month")}
              </p>
            </div>
          </div>

          {/* Charts + Top Selling Events */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Revenue by Category */}

            <RevenuePieChart />

            {/* Events Section */}
            <div className="space-y-8">
              {/* Upcoming Events */}
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                  {t("organizer_analytics.upcoming_events")}
                  {upcomingEvents && upcomingEvents.length > 0 && (
                    <span
                      className="inline-flex items-center justify-center 
                        px-3 py-1 
                        text-xs font-medium 
                        text-blue-700 
                        bg-blue-50 
                        border border-blue-200 
                        rounded-full 
                        shadow-sm
                        min-w-6 h-6
                      "
                    >
                      {upcomingEvents.length}
                    </span>
                  )}
                </h2>
                <ul className="mt-4 space-y-4">
                  {upcomingEvents && upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => {
                      const startDate = event.startDate
                        ? new Date(event.startDate)
                        : null;
                      const endDate = event.endDate
                        ? new Date(event.endDate)
                        : null;

                      return (
                        <li
                          key={`upcoming-${event.id}`}
                          className="flex items-start gap-4"
                        >
                          <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                            <CalendarDays className="h-5 w-5 text-green-600 dark:text-green-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">
                              {event.title}
                            </p>
                            <div className="mt-1 flex items-center text-xs text-neutral-400">
                              <CalendarDays className="mr-1 h-3.5 w-3.5" />
                              {startDate?.toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                              {endDate && (
                                <>
                                  <span className="mx-1">-</span>
                                  {endDate.toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </>
                              )}
                            </div>
                          </div>
                          <Link
                            href={`/events/${event.id}`}
                            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400 whitespace-nowrap"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-sm text-neutral-400">
                      {t("organizer_analytics.no_upcoming_events")}
                    </li>
                  )}
                </ul>
                <div className="mt-4">
                  <Link
                    href="/organizers/events"
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {t("organizer_analytics.view_all_events")} →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
