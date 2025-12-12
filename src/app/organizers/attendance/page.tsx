"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchEventsByOrganizer } from "@/lib/features/eventSlice";
import { fetchTicketsByEvent, checkInTicket } from "@/lib/features/checkinSlice";
import Spinner from "@/components/Spinner";
import Swal from "sweetalert2";
import { CheckCircleIcon, ClockIcon, TicketIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
const Select = dynamic(() => import("react-select"), { ssr: false });

export default function AttendancePage() {
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();
  const { events, loading } = useAppSelector((s) => s.events);
  const { tickets: checkinTickets, loading: ticketsLoading } = useAppSelector((s) => s.checkin);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const eventOptions = events.map((ev) => ({ value: ev.id, label: ev.title }));
  const [mounted, setMounted] = useState(false);
  const activityRef = useRef<HTMLDivElement | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "checked">("all");
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [switchingEvent, setSwitchingEvent] = useState<boolean>(false);

  useEffect(() => {
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (!userStr) return;
      const user = JSON.parse(userStr || "{}");
      const organizerId = user?.uid || user?.id;
      if (organizerId) dispatch(fetchEventsByOrganizer(organizerId));
    } catch (e) {
      // ignore parsing errors
    }
  }, [dispatch]);
  useEffect(() => setMounted(true), []);
  // Auto-scroll Activity Stream to latest
  useEffect(() => {
    if (activityRef.current) {
      const el = activityRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [mounted, selectedEventId]);

  // Fetch tickets when an event is selected and show switching loader only then
  useEffect(() => {
    if (selectedEventId) {
      setSwitchingEvent(true);
      (async () => {
        try {
          await (dispatch as any)(fetchTicketsByEvent({ eventId: selectedEventId })).unwrap?.();
        } finally {
          setSwitchingEvent(false);
        }
      })();
    }
  }, [dispatch, selectedEventId]);

  const { totalTickets, checkedInCount, remainingCount, percentChecked } = useMemo(() => {
    const total = selectedEventId ? checkinTickets.length : 0;
    const checkedIn = checkinTickets.filter((t: any) => t?.checkedIn === true).length;
    const remaining = Math.max(total - checkedIn, 0);
    const percent = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
    return { totalTickets: total, checkedInCount: checkedIn, remainingCount: remaining, percentChecked: percent };
  }, [checkinTickets, selectedEventId]);
  
  if (loading || !mounted) {
    return <Spinner  padding="py-50" />;
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap gap-2">
          <a href="#" className="text-base font-medium text-neutral-400 hover:text-primary">{t("dashboard_breadcrumb")}</a>
          <span className="text-base font-medium text-neutral-400">/</span>
          <span className="text-base font-medium text-primary dark:text-white">{t("organizer_attendance.title")}</span>
        </div>

        {/* Page Title */}
        <div className="mb-8 flex flex-wrap justify-between gap-3">
          <div className="flex min-w-72 flex-col gap-3">
            <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-primary dark:text-white">
              {t("organizer_attendance.title")}
            </p>
            <p className="text-base font-normal text-neutral-400">
              {t("organizer_attendance.subtitle")}
            </p>
          </div>
          <div className="flex flex-col w-full md:w-[410px] gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2">{t("organizer_attendance.select_event")}</label>
              <div className="relative w-full">
                {mounted ? (
                <Select
                  options={[{ value: "", label: t("organizer_attendance.all_events") }, ...eventOptions]}
                  value={[{ value: "", label: t("organizer_attendance.all_events") }, ...eventOptions].find(o => o.value === selectedEventId) || { value: "", label: t("organizer_attendance.all_events") }}
                  onChange={(opt) => setSelectedEventId((opt as any)?.value ?? "")}
                  isLoading={ticketsLoading}
                  className="react-select-container w-full"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderRadius: 12,
                      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                      boxShadow: state.isFocused ? "0 0 0 4px rgb(59 130 246 / 0.2)" : "none",
                      paddingLeft: 2,
                      minHeight: 46,
                      width: '100%',
                      ':hover': { borderColor: '#9ca3af' },
                    }),
                    valueContainer: (base) => ({ ...base, padding: '2px 8px' }),
                    menu: (base) => ({ ...base, borderRadius: 12, overflow: 'hidden', zIndex: 50 }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? 'rgba(59,130,246,0.08)' : 'white',
                      color: '#111827',
                      cursor: 'pointer',
                    }),
                  }}
                />
                ) : (
                  <div className="h-[46px] w-full rounded-xl border border-gray-300 bg-white shadow-sm" />
                )}
              </div>
            </div>
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${statusFilter === 'all' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                {t("organizer_attendance.filter_all")}
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${statusFilter === 'pending' ? 'bg-yellow-500 text-white border-yellow-500' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                {t("organizer_attendance.filter_pending")}
              </button>
              <button
                onClick={() => setStatusFilter("checked")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${statusFilter === 'checked' ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                {t("organizer_attendance.filter_checked_in")}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  className="flex-grow w-full px-4 py-2 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder={t("organizer_attendance.search_placeholder")}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-background-dark transition-colors">{t("organizer_attendance.search_button")}</button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {switchingEvent && (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm animate-pulse">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
                          <div className="flex-1">
                            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
                          </div>
                        </div>
                        <div className="h-8 w-20 rounded bg-gray-200 dark:bg-gray-800" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!switchingEvent && checkinTickets
                .filter((t) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.trim().toLowerCase();
                  const num = (t.ticketNumber || "").toString().toLowerCase();
                  return num.includes(q);
                })
                .filter((t) => {
                  const isChecked = (t as any)?.checkedIn === true;
                  if (statusFilter === 'all') return true;
                  if (statusFilter === 'pending') return !isChecked;
                  if (statusFilter === 'checked') return isChecked;
                  return true;
                })
                .map((ticket) => {
                  const alreadyChecked = (ticket as any)?.checkedIn === true;
                  return (
                  <div key={ticket.id} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">#{ticket.ticketNumber}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {ticket.attendeeName?.trim() || ticket.attendeeEmail || t("organizer_attendance.attendee_fallback")}
                      </p>
                      {ticket.attendeeEmail && ticket.attendeeName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.attendeeEmail}</p>
                      )}
                      <div className="mt-1">
                        {alreadyChecked ? (
                          <span className="inline-flex items-center gap-1.5 text-green-700 text-xs font-semibold">
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            {t("organizer_attendance.status_checked_in")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-yellow-600 text-xs font-semibold">
                            <ClockIcon className="h-3.5 w-3.5" />
                            {t("organizer_attendance.status_pending")}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* <div className="hidden md:block">
                      <Image
                        src={
                          (ticket as any)?.qrCodeUrl && typeof (ticket as any).qrCodeUrl === 'string'
                            ? (ticket as any).qrCodeUrl as string
                            : `https://api.qrserver.com/v1/create-qr-code/?size=84x84&data=${encodeURIComponent(`${selectedEventId || ''}|${ticket.ticketNumber || ''}|${ticket.id}`)}`
                        }
                        alt={t("organizer_attendance.qr_alt")}
                        title={t("organizer_attendance.qr_title")}
                        width={84}
                        height={84}
                        className="h-20 w-20 rounded-md bg-white p-1 shadow border border-gray-200 dark:border-gray-800"
                      />
                    </div> */}
                    {/* <button
                      disabled={alreadyChecked || checkingId === (ticket.id as string)}
                      onClick={async () => {
                        try {
                          setCheckingId(ticket.id as string);
                          await (dispatch as any)(checkInTicket({ ticketId: ticket.id as string })).unwrap?.();
                          Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: t("organizer_attendance.toast_checked_in_success"),
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true,
                          });
                        } catch (e) {
                          // Optionally show error toast
                        } finally {
                          setCheckingId(null);
                        }
                      }}
                      className={`${alreadyChecked
                        ? 'px-2 py-1 text-[11px] md:text-xs bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-default'
                        : checkingId === (ticket.id as string)
                        ? 'px-2 py-1 md:px-4 md:py-2 text-[11px] md:text-xs bg-primary-600/80 text-white cursor-wait animate-pulse'
                        : 'px-2 py-1 md:px-4 md:py-2 text-[11px] md:text-xs bg-primary text-white hover:bg-primary-600 cursor-pointer focus:ring-primary'} rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-background-dark`}
                    >
                      {alreadyChecked ? t("organizer_attendance.action_checked_in") : checkingId === (ticket.id as string) ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-block h-2.5 w-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t("organizer_attendance.action_checking")}
                        </span>
                      ) : t("organizer_attendance.action_check_in")}
                    </button> */}
                  </div>
                  );
                })}
              {!switchingEvent && !ticketsLoading && selectedEventId && checkinTickets.length === 0 && (
                <div className="p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900/40">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <TicketIcon className="h-6 w-6" />
                  </div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {searchQuery ? t("organizer_attendance.no_tickets_search") : t("organizer_attendance.no_tickets_event")}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? t("organizer_attendance.no_tickets_search_hint")
                      : t("organizer_attendance.no_tickets_event_hint")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("organizer_attendance.live_event_stats")}</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t("organizer_attendance.stats_checked_in")}</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{checkedInCount} / {totalTickets}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentChecked}%` }}></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t("organizer_attendance.stats_remaining")}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{remainingCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm">
              <div className="text-center mb-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("organizer_attendance.total_check_ins")}</p>
                <p className="text-5xl font-black text-primary dark:text-blue-300">{checkedInCount}</p>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 border-t border-gray-200 dark:border-gray-700 pt-3">{t("organizer_attendance.activity_title")}</h2>
              <div className="relative">
                {/* Top gradient fade */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white dark:from-gray-900 to-transparent z-10" />
                {/* Bottom gradient fade */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white dark:from-gray-900 to-transparent z-10" />
                <div
                  ref={activityRef}
                  className="activity-scroll space-y-4 h-64 overflow-y-scroll pr-3 pt-5 pb-5 text-sm scroll-smooth overscroll-contain"
                  aria-label={t("organizer_attendance.activity_aria_label")}
                  style={{ scrollbarGutter: "stable both-edges" }}
                >
                  {[...checkinTickets]
                    .sort((a: any, b: any) => {
                      const at = (a as any)?.checkedInAt || a.createdAt;
                      const bt = (b as any)?.checkedInAt || b.createdAt;
                      return new Date(bt).getTime() - new Date(at).getTime();
                    })
                    .slice(0, 100)
                    .map((ticketItem) => {
                      const isChecked = (ticketItem as any)?.checkedIn === true;
                      const whenStr = ((ticketItem as any)?.checkedInAt || ticketItem.createdAt)
                        ? new Date(((ticketItem as any)?.checkedInAt || ticketItem.createdAt) as string).toLocaleString()
                        : "";
                      return (
                        <div key={ticketItem.id as string} className="flex items-center gap-3">
                          {isChecked ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
                          ) : (
                            <ClockIcon className="h-5 w-5 text-yellow-600" aria-hidden="true" />
                          )}
                          <p className="flex-1 text-gray-800 dark:text-gray-200">
                            {t("organizer_attendance.activity_ticket_label")} <span className="font-semibold">#{ticketItem.ticketNumber}</span> {isChecked ? t("organizer_attendance.activity_checked_in") : t("organizer_attendance.activity_issued")}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">{whenStr}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        /* Custom scrollbar for activity stream */
        .activity-scroll {
          scrollbar-width: thin; /* Firefox */
          scrollbar-color: rgba(59,113,202,0.5) transparent; /* thumb track */
        }
        .activity-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .activity-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .activity-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(59,113,202,0.45); /* primary-ish */
          border-radius: 8px;
        }
        .activity-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(59,113,202,0.7);
        }
      `}</style>
    </main>
  );
}