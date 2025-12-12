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
} from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/lib/features";
import { fetchOrganizerAnalytics } from "@/lib/features/analyticsSlice";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import dynamic from "next/dynamic";

const AttendanceByCategoryChart = dynamic(
  () => import("@/components/AttendanceByCategoryChart"),
  { ssr: false }
);

export default function OrganizerAnalytics() {
  const { t } = useTranslation("common");
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useSelector((state: RootState) => state.users);
  const { 
    revenueByCategory, 
    totalTickets, 
    totalEvents, 
    topSellingEvents, 
    totalCheckIns, 
    attendanceRate, 
    loading 
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
              <Link href="/organizers/events" className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg border border-primary px-5 text-base font-bold tracking-[0.015em] text-primary hover:bg-primary/10 dark:text-white dark:hover:bg-primary/20 sm:w-auto">
                <CalendarDays className="h-5 w-5" />
                <span className="truncate">{t("organizer_analytics.view_all_events")}</span>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

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

            {/* Attendance Rate */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-neutral-400">
                    {t("organizer_analytics.attendance_rate")}
                  </p>
                  <p className="mt-2 text-4xl font-bold text-primary dark:text-white">
                    {loading ? "—" : `${attendanceRate}%`}
                  </p>
                  {/* <p className="text-sm text-neutral-400 mt-1">
                    {totalCheckIns?.toLocaleString() || 0} {t("organizer_analytics.check_ins")}
                  </p> */}
                </div>
                <div className="flex size-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
              <p className="mt-4 text-sm text-neutral-400">
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {attendanceRate > 0 ? '✓ ' : '✗'} {totalCheckIns?.toLocaleString() || 0} 
                </span>{" "}
                {t("organizer_analytics.of_tickets_checked_in")}
              </p>
            </div>
          </div>

          {/* Charts + Top Selling Events */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            
            {/* Attendance by Category Chart */}
            <div className="lg:col-span-2">
              <AttendanceByCategoryChart />
            </div>

            {/* Top Selling Events */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                {t("organizer_analytics.top_selling_events")}
              </h2>
              <ul className="mt-4 space-y-4">
                {(topSellingEvents || []).map((event) => (
                  <li key={event.id} className="flex items-start gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                      <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        {event.title}
                      </p>
                      <p className="text-sm text-neutral-400">
                        {t("organizer_analytics.tickets_sold_label")}{" "}
                        {event.ticketsCount?.toLocaleString?.() || 0}
                      </p>
                    </div>
                  </li>
                ))}
                {!loading && (!topSellingEvents || topSellingEvents.length === 0) && (
                  <li className="text-sm text-neutral-400">{t("organizer_analytics.no_sales_yet")}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
