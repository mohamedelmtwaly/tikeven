"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from 'next/navigation';
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import type { RootState } from "@/lib/features";
import { fetchEvents, fetchEventsByOrganizer, updateEventStatus } from "@/lib/features/eventSlice";
import { Event, EventStatus as Status } from "@/types/event";
import type { Report } from "@/lib/features/reportsSlice";
import { fetchReports } from "@/lib/features/reportsSlice";
import { db } from "@/services/firebase/config";
import { EyeIcon, EllipsisVerticalIcon, FunnelIcon, TicketIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Pagination from "@/components/Pagination";
import Swal from "sweetalert2";

export default function AdminBadEventsPage() {
  const { t } = useTranslation('common');
  const searchParams = useSearchParams();
  const organizerId = searchParams.get('organizerId');
  const [isUserReportsOpen, setIsUserReportsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuEventId, setOpenMenuEventId] = useState<string | null>(null);
  const [eventStatuses, setEventStatuses] = useState<Record<string, Status>>({});
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
  const [checkedInCounts, setCheckedInCounts] = useState<Record<string, number>>({});
  const [showOnlyReported, setShowOnlyReported] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status | ''>('');
  
  // Handle status filter change with proper type safety
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as Status | '';
    setStatusFilter(value);
  };
  const [searchTerm, setSearchTerm] = useState('');
  
  // Define status options for the dropdown
  const statusOptions = [Status.PUBLISHED, Status.BANNED];
  const rowsPerPage = 10;

  // Function to determine event status based on dates
  const getEventStatus = useCallback((startDate: string, endDate: string, currentStatus?: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { status: t('admin_events.status.upcoming'), color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-500' };
    } else if (now >= start && now <= end) {
      return { status: t('admin_events.status.active'), color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-500' };
    } else {
      return { status: t('admin_events.status.completed'), color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500' };
    }
  }, []);
  const dispatch = useDispatch();
  const { events, loading, error } = useSelector(
    (state: RootState) => state.events
  );
  const {
    items: reportItems,
    loading: reportsLoading,
    error: reportsError,
  } = useSelector((state: RootState) => state.reports);
  const [reporterDetails, setReporterDetails] = useState<
    Record<string, { name?: string; email?: string; image?: string | null }>
  >({});

  useEffect(() => {
    const loadTicketCounts = async (eventIds: string[]) => {
      const counts: Record<string, number> = {};
      const checkedIn: Record<string, number> = {};
      
      for (const eventId of eventIds) {
        // Total tickets count
        const ticketsQuery = query(
          collection(db, "tickets"),
          where("eventId", "==", eventId)
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        counts[eventId] = ticketsSnapshot.size;
        
        // Checked-in tickets count
        const checkedInQuery = query(
          collection(db, "tickets"),
          where("eventId", "==", eventId),
          where("checkedIn", "==", true)
        );
        const checkedInSnapshot = await getDocs(checkedInQuery);
        checkedIn[eventId] = checkedInSnapshot.size;
      }
      
      setTicketCounts(prev => ({ ...prev, ...counts }));
      setCheckedInCounts(prev => ({ ...prev, ...checkedIn }));
    };

    const loadData = async () => {
      try {
        let eventsData: Event[] = [];
        
        if (organizerId) {
          // For organizer-specific view, use the filtered events
          const action = await dispatch(fetchEventsByOrganizer(organizerId) as any);
          eventsData = action.payload || [];
        } else {
          // For all events view
          const action = await dispatch(fetchEvents() as any);
          eventsData = action.payload || [];
        }
        
        // Only load ticket counts for the current events, filtering out any undefined IDs
        const eventIds = eventsData.map(e => e.id).filter((id): id is string => id !== undefined);
        await loadTicketCounts(eventIds);
        await dispatch(fetchReports() as any);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [dispatch, organizerId]);

  const reportsByEvent = useMemo(() => {
    const byEvent: Record<string, Report[]> = {};
    reportItems.forEach((report) => {
      if (!report.eventId) return;
      if (!byEvent[report.eventId]) {
        byEvent[report.eventId] = [];
      }
      byEvent[report.eventId].push(report);
    });
    return byEvent;
  }, [reportItems]);

  // Filter events based on search, report status, and status filter
  const filteredEvents = events.filter(event => {
    if (!event.id) return false; // Skip events without an ID
    
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.organizerId && event.organizerId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesReported = !showOnlyReported || (event.id in reportsByEvent && reportsByEvent[event.id].length > 0);
    const eventStatus = event.status || 'Published';
    const matchesStatus = !statusFilter || eventStatus === statusFilter;
    return matchesSearch && matchesReported && matchesStatus;
  });

  const selectedEvent = selectedEventId
    ? events.find((e: any) => e.id === selectedEventId) || null
    : null;

  const selectedEventReports = selectedEventId
    ? reportsByEvent[selectedEventId] || []
    : [];

  const highlightedEvent = selectedEvent || events[0] || null;

  // When the modal is open, load reporter user data for any
  // reporterIds we haven't resolved yet.
  useEffect(() => {
    if (!isUserReportsOpen || selectedEventReports.length === 0) return;

    const loadReporters = async () => {
      const missingIds = Array.from(
        new Set(
          selectedEventReports
            .map((r) => r.reporterId)
            .filter(
              (id): id is string =>
                !!id && !reporterDetails[id]
            )
        )
      );

      if (missingIds.length === 0) return;

      try {
        const updates: Record<string, { name?: string; email?: string; image?: string | null }> = {};

        await Promise.all(
          missingIds.map(async (id) => {
            try {
              const snap = await getDoc(doc(db, "users", id));
              if (snap.exists()) {
                const data = snap.data() as any;
                updates[id] = {
                  name: data.name,
                  email: data.email,
                  image: data.image ?? null,
                };
              } else {
                updates[id] = {};
              }
            } catch (e) {
              console.error("Failed to load reporter user", id, e);
            }
          })
        );

        if (Object.keys(updates).length > 0) {
          setReporterDetails((prev) => ({ ...prev, ...updates }));
        }
      } catch (e) {
        console.error("Failed to resolve reporter users", e);
      }
    };

    loadReporters();
  }, [isUserReportsOpen, selectedEventReports, reporterDetails]);

  // Ensure currentPage is always within valid range when events change
  useEffect(() => {
    const totalPages = events.length > 0 ? Math.ceil(events.length / rowsPerPage) : 0;

    // If there are no pages, reset to page 1
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    // If current page is beyond last page, clamp it
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [events.length, rowsPerPage, currentPage]);

  return (
    <div className="relative flex min-h-screen w-full font-display bg-background-light dark:bg-background-dark">

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Link href="/admin" className="text-black dark:text-slate-400 text-base font-medium leading-normal hover:text-primary">
              {t('dashboard')}
            </Link>
            <span className="text-[#4c669a] dark:text-slate-500 text-base font-medium leading-normal">
              /
            </span>
            <span className="text-primary dark:text-white text-base font-medium leading-normal">
              {t('admin_events.title')}
            </span>
          </div>

          {/* Page header */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div className="flex flex-col gap-2">
              <p className="text-[#0d121b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                {t('admin_events.title')}
              </p>
              <p className="text-[#4c669a] dark:text-slate-400 text-base font-normal leading-normal">
                {t('admin_events.subtitle')}
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">

            {/* Filters */}
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
              <div className="relative flex-1 min-w-[250px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('common:search')}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setShowOnlyReported(!showOnlyReported)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${showOnlyReported 
                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-500' 
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <FunnelIcon className="h-4 w-4" />
                {showOnlyReported ? t('admin_events.show_all_events') : t('admin_events.show_reported_only')}
              </button>
              <select 
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all py-2 px-3"
              >
                <option value="">{t('filters.status')}: {t('filters.all')}</option>
                <option value={Status.BANNED}>{t('admin_events.status.banned')}</option>
                <option value={Status.PUBLISHED}>{t('admin_events.status.published')}</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-sm font-semibold text-[#4c669a] dark:text-slate-400">
                    {t('admin_events.table_headers.event')}
                  </th>
                  <th className="p-3 text-sm font-semibold text-[#4c669a] dark:text-slate-400">
                    {t('admin_events.table_headers.organizer')}
                  </th>
                  <th className="p-3 text-sm font-semibold text-[#4c669a] dark:text-slate-400 text-center">
                    {t('admin_events.table_headers.status')}
                  </th>
                  <th className="p-3 text-sm font-semibold text-[#4c669a] dark:text-slate-400 text-center">
                    {t('admin_events.table_headers.tickets')}
                  </th>
                  <th className="p-3 text-sm font-semibold text-[#4c669a] dark:text-slate-400 text-center">
                    {t('tickets.checked_in')}
                  </th>
                  <th className="p-3 text-sm font-semibold text-[#4c669a] dark:text-slate-400 text-center">
                    {t('admin_events.table_headers.reports')}
                  </th>
                  <th className="p-3 text-sm font-semibold text-[#4c669a] dark:text-slate-400 text-center">
                    {t('admin_events.table_headers.actions')}
                  </th>
                  <th className="p-3 text-sm font-semibold text-[#4c669a] dark:text-slate-400">
                    {t('admin_events.table_headers.last_reported')}
                  </th>
                  <th className="p-3 text-sm font-semibold text-[#4c669a] dark:text-slate-400">
                    {t('admin_events.table_headers.activity')}
                  </th>
                  <th className="p-3 text-sm font-semibold text-[#4c669a] dark:text-slate-400" />
                </tr>
              </thead>
              <tbody>
                {loading && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-4 text-center text-sm text-[#4c669a] dark:text-slate-400"
                      >
                        {t('admin_events.loading')}
                      </td>
                    </tr>
                  )}
                  {!loading && error && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-4 text-center text-sm text-red-600 dark:text-red-400"
                      >
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && filteredEvents.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-4 text-center text-sm text-[#4c669a] dark:text-slate-400"
                      >
                        {t('admin_events.loading')}
                      </td>
                    </tr>
                  )}
                  {!loading && !error &&
                    filteredEvents
                      .slice(
                        (currentPage - 1) * rowsPerPage,
                        currentPage * rowsPerPage
                      )
                      .map((event) => {
                        const eventId = event.id as string | undefined;
                        const eventReports = eventId ? reportsByEvent[eventId] || [] : [];
                        const lastReport = eventReports.reduce<Report | null>((latest: Report | null, current: Report) => {
                          if (!current.createdAt) return latest;
                          if (!latest || !latest.createdAt) return current;
                          return new Date(current.createdAt) > new Date(latest.createdAt)
                            ? current
                            : latest;
                        }, null);

                        const lastReportDate = lastReport?.createdAt
                          ? new Date(lastReport.createdAt).toLocaleDateString()
                          : t('admin_events.reports_modal.time_not_available');

                        return (
                      <tr
                        key={event.id}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="p-3 text-[#0d121b] dark:text-white font-medium">
                          {event.title || t('admin_events.event_details.title_untitled')}
                        </td>
                        <td className="p-3 text-[#4c669a] dark:text-slate-300">
                          {event.organizerName || event.organizerId || t('admin_events.organizer_unknown')}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.status === Status.BANNED 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' 
                              : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          }`}>
                            {event.status || Status.PUBLISHED}
                          </span>
                        </td>
                        <td className="p-3 text-[#4c669a] dark:text-slate-300 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <TicketIcon className="h-4 w-4" />
                            {eventId ? (ticketCounts[eventId] || 0) : 0}
                          </div>
                        </td>
                        <td className="p-3 text-[#4c669a] dark:text-slate-300 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <TicketIcon className="h-4 w-4 text-green-500" />
                            {eventId ? (checkedInCounts[eventId] || 0) : 0}
                          </div>
                        </td>
                        <td className="p-3 text-[#4c669a] dark:text-slate-300 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {eventReports.length}
                          </div>
                        </td>
                        <td className="p-3 text-[#4c669a] dark:text-slate-300 text-center">
                          {eventId ? (
                            <Link
                              href={`/admin/events/${eventId}`}
                              className="flex items-center gap-2 mx-auto text-[#4c669a] dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400">-
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[#4c669a] dark:text-slate-300">
                          {lastReportDate}
                        </td>
                        <td className="p-3">
                          <span className={`text-sm font-medium leading-normal inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getEventStatus(event.startDate, event.endDate).color} border`}>
                            {getEventStatus(event.startDate, event.endDate).status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              className="text-[#4c669a] dark:text-slate-400 hover:text-primary"
                              onClick={() =>
                                setOpenMenuEventId((prev) =>
                                  prev === eventId ? null : eventId || null
                                )
                              }
                            >
                              <EllipsisVerticalIcon className="h-5 w-5" />
                            </button>

                            {eventId && openMenuEventId === eventId && (
                              <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 focus:outline-none z-10">
                                <div className="py-1 text-sm text-slate-700 dark:text-slate-200">
                                  {statusOptions.map((status) => (
                                    <button
                                      key={status}
                                      type="button"
                                      className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                                      onClick={async () => {
                                        if (!eventId) return;
                                        
                                        // Check if trying to ban an event that starts in less than 2 days
                                        if (status === Status.BANNED) {
                                          const now = new Date();
                                          const startDate = new Date(event.startDate);
                                          const timeDiff = startDate.getTime() - now.getTime();
                                          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
                                          
                                          if (daysDiff <= 1) {
                                            Swal.fire({
                                              title: t('admin_events.cannot_ban_title'),
                                              text: t('admin_events.cannot_ban_message'),
                                              icon: "warning",
                                              confirmButtonColor: "#3b82f6"
                                            });
                                            return;
                                          }
                                        }
                                        
                                        setEventStatuses((prev) => ({
                                          ...prev,
                                          [eventId]: status,
                                        }));
                                        
                                        // Persist status change to Firestore/Redux and send notification
                                        try {
                                          await dispatch(
                                            updateEventStatus({ 
                                              id: eventId, 
                                              status: status as Status 
                                            }) as any
                                          );
                                          
                                          // Show success message
                                          Swal.fire({
                                            icon: 'success',
                                            title: 'Status Updated',
                                            text: `Event has been ${status.toLowerCase()}. The organizer has been notified.`,
                                            timer: 2000,
                                            showConfirmButton: false,
                                          });
                                        } catch (error) {
                                          console.error('Error updating event status:', error);
                                          Swal.fire({
                                            icon: 'error',
                                            title: 'Error',
                                            text: 'Failed to update event status. Please try again.',
                                          });
                                          
                                          // Revert the status in the UI if the update fails
                                          setEventStatuses((prev) => ({
                                            ...prev,
                                            [eventId]: events.find(e => e.id === eventId)?.status || Status.PUBLISHED,
                                          }));
                                        }
                                        
                                        setOpenMenuEventId(null);
                                      }}
                                    >
                                      {status}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                rowsPerPage={rowsPerPage}
                rowCount={filteredEvents.length}
                currentPage={currentPage}
                onChangePage={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </main>

      {/* User Reports Modal */}
      {isUserReportsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsUserReportsOpen(false);
          }}
        >
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {organizerId ? `${t('events_by_organizer')}` : t('events')}
                  </h1>
                  {organizerId && (
                    <Link 
                      href="/admin/events"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      {t('clear_filter')}
                    </Link>
                  )}
                </div>
                {reportsError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {reportsError}
                  </p>
                )}
              </div>
              <button
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setIsUserReportsOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {selectedEventReports.length === 0 && !reportsLoading && !reportsError && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t('admin_events.reports_modal.no_reports')}
                  </p>
                )}

                {selectedEventReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {report.reporterId?.slice(0, 2).toUpperCase() || "UR"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {report.reporterId
                              ? reporterDetails[report.reporterId]?.name || report.reporterId
                              : t('admin_events.reports_modal.reporter_anonymous')}
                          </p>
                          {report.reporterId &&
                            reporterDetails[report.reporterId]?.email && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {reporterDetails[report.reporterId]?.email}
                              </p>
                            )}
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {report.createdAt
                              ? new Date(report.createdAt).toLocaleString()
                              : t('admin_events.reports_modal.time_not_available')}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        {report.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 flex-grow">
                      {report.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
