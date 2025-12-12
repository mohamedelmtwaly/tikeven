"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { slugifyTitle } from "@/lib/slug";
import { getAllEvents, EventItem } from "@/lib/events/eventSlice";
import EventReviews from "@/components/EventReviews";
import { fetchVenues, Venue } from "@/lib/features/venueSlice";
import { fetchCategories } from "@/lib/features/categorySlice";
import { fetchUsers } from "@/lib/features/userSlice";
import ReportEventModal from "@/components/ReportEventModal";
import type User from "@/types/user";
import {
  CalendarDaysIcon,
  MapPinIcon,
  TicketIcon,
  UserIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Loading from "./loading";

function formatDateTime(iso: string): string {
  if (!iso) return "";
  const dt = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  return new Intl.DateTimeFormat("en-US", opts).format(dt);
}

function formatShortDate(iso: string): string {
  if (!iso) return "";
  const dt = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return new Intl.DateTimeFormat("en-US", opts).format(dt);
}

export default function EventDetailsPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const idRaw = params?.id ?? "";
  const cleanedId = decodeURIComponent(String(idRaw)).trim().toLowerCase();
  const dispatch = useDispatch();
  const { allEvents, loading } = useSelector((s: any) => s.eventsInfo) as {
    allEvents: EventItem[];
    loading: boolean;
  };
  const { venues } = useSelector((s: any) => s.venues || { venues: [] });
  const { categories } = useSelector((s: any) => s.categories || { categories: [] });
  const { users, currentUser } = useSelector((s: any) => s.users || { users: [], currentUser: null });

  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    if (!allEvents || allEvents.length === 0) {
      dispatch(getAllEvents() as any);
    }
    if (!venues || venues.length === 0) {
      dispatch(fetchVenues() as any);
    }
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories() as any);
    }
    if (!users || users.length === 0) {
      dispatch(fetchUsers() as any);
    }
  }, [dispatch, allEvents, venues, categories, users]);

  const event = useMemo(() => {
    if (!allEvents) return undefined;
    return allEvents.find((e: EventItem) => {
      const idLower = String(e.id).toLowerCase();
      return idLower === cleanedId;
    });
  }, [allEvents, cleanedId]);

  const venueMap = useMemo(() => {
    const map: Record<string, Venue> = {};
    (venues as Venue[] | undefined)?.forEach((v) => {
      if (v && v.id) {
        map[v.id] = v;
      }
    });
    return map;
  }, [venues]);

  const venueId = event?.venue || "";
  const venueData = venueMap[venueId];
  const venueTitle = venueData?.title || t("event_venue_label", { defaultValue: "Venue" });
  const venueAddress = venueData?.address || "";
  const venueCity = venueData?.city || "";
  const venueCountry = venueData?.country || "";

  const baseLower = venueAddress.toLowerCase();
  const parts: string[] = [];
  if (venueAddress) parts.push(venueAddress);
  if (venueCity && !baseLower.includes(venueCity.toLowerCase())) parts.push(venueCity);
  if (venueCountry && !baseLower.includes(venueCountry.toLowerCase())) parts.push(venueCountry);

  const venueFullAddress = parts.join(", ");
  const venueDescription =
    venueData?.description ||
    `${venueTitle} ${t("event_default_venue_description", { defaultValue: "is a modern venue designed to host memorable events and experiences." })}`;

  const venueName = venueTitle;
  const venueLocation = venueFullAddress || venueAddress || "";

  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    (categories as any[] | undefined)?.forEach((c: any) => {
      if (c && c.id) {
        map[c.id] = c.name;
      }
    });
    return map;
  }, [categories]);

  const categoryLabel = event ? categoryNameMap[(event as any).category] || "Event" : "Event";

  const organizerUser = useMemo(() => {
    if (!event || !users) return null;
    return (users as User[]).find((u) => u.id === event.organizerId);
  }, [event, users]);

  const organizerName = organizerUser?.name || "Organizer";

  const isPast = useMemo(() => {
    try {
      if (!event?.endDate) return false;
      return new Date(event.endDate).getTime() < Date.now();
    } catch {
      return false;
    }
  }, [event?.endDate]);

  if (!event) {
    if (loading || !allEvents || allEvents.length === 0) {
      return <Loading />;
    }
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow pt-8 sm:pt-12 md:pt-16">
        <div className="max-w-2xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-4">{t("event_not_found", { defaultValue: "Event not found" })}</h1>
          <Link href="/events" className="inline-flex items-center gap-2 text-primary underline">
            <ArrowLeftIcon className="w-4 h-4" /> {t("events_back_to_events", { defaultValue: "Back to Events" })}
          </Link>
        </div>
      </main>
    );
  }

  const orderUrl = `/events/${encodeURIComponent(String(event.id))}/order`;
  const eventUrl = `/events/${encodeURIComponent(String(event.id))}`;

  return (
    <main className="container mx-auto my-10 px-4 sm:px-6 lg:px-8 flex-grow pt-8 sm:pt-12 md:pt-16">
      <div className="flex flex-col gap-8">
        <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-xl overflow-hidden">
          <img
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
            src={event.image && event.image.trim() !== "" ? event.image : "/logo.png"}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.onerror = null;
              target.src = "/logo.png";
            }}
          />
          <div className="absolute top-4 left-4 bg-indigo-100/90 dark:bg-indigo-400/90 text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {categoryLabel}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 md:p-8 lg:p-10 text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tighter">{event.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary mb-4 md:mb-5">{t("event_about_title", { defaultValue: "About The Event" })}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-8 md:text-lg max-w-prose">
                {event.descriptionOrganizer} <br />
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary mb-4 md:mb-5">{t("event_venue_info_title", { defaultValue: "Venue Information" })}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="bg-slate-200 dark:bg-slate-800 rounded-xl h-80 w-full overflow-hidden">
                  <img
                    alt={venueName}
                    className="w-full h-full object-cover"
                    src={
                      venueData?.images && venueData.images.length > 0 && venueData.images[0]
                        ? venueData.images[0]
                        : "/logo.png"
                    }
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/logo.png";
                    }}
                  />
                </div>
                <div className="flex flex-col gap-3 text-slate-600 dark:text-slate-400">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{venueName}</h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed max-w-prose">
                    <span className="font-semibold">{t("event_description_label", { defaultValue: "Description:" })}&nbsp;</span>
                    {venueDescription}
                  </p>
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="w-5 h-5 text-primary" />
                    <span>{venueLocation || event.venue}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TicketIcon className="w-5 h-5 text-primary" />
                    <span>
                      {typeof venueData?.capacity === "number"
                        ? `${t("event_capacity_label", { defaultValue: "Capacity" })}: ${venueData.capacity.toLocaleString()}`
                        : t("event_capacity_unavailable", { defaultValue: "Capacity information not available" })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <EventReviews eventId={event.id} currentUserId={currentUser?.id} />
          </div>

          <div className="lg:col-span-1 lg:max-w-sm w-full lg:justify-self-end">
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 ring-1 ring-blue-900/5 shadow-[#1e3a8a]/10 flex flex-col gap-6">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t("event_date_time_title", { defaultValue: "Date and Time" })}</h3>
                  <div className="flex items-start gap-3">
                    <CalendarDaysIcon className="w-5 h-5 mt-0.5 text-primary" />
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{t("event_start_label", { defaultValue: "Start:" })} {formatDateTime(event.startDate)}</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{t("event_end_label", { defaultValue: "End:" })} {formatDateTime(event.endDate)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t("event_venue_label", { defaultValue: "Venue" })}</h3>
                  <div className="inline-flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-primary" />
                    <Link 
                      href={`/venues/${event.venue}`}
                      className="font-semibold text-slate-800 dark:text-slate-100 hover:text-primary dark:hover:text-secondary underline underline-offset-2"
                    >
                      {venueName}
                    </Link>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{venueLocation || event.venue}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t("event_organizer_title", { defaultValue: "Organizer" })}</h3>
                  <div className="inline-flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-primary" />
                    <Link 
                      href={`/organizer/${event.organizerId}`}
                      className="font-semibold text-slate-800 dark:text-slate-100 hover:text-primary dark:hover:text-secondary underline underline-offset-2"
                    >
                      {organizerName}
                    </Link>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t("event_posted_on", { defaultValue: "Posted on:" })} {formatShortDate(new Date(new Date(event.startDate).getTime() - 45 * 24 * 60 * 60 * 1000).toISOString())}</p>
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6 flex flex-col gap-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t("event_get_your_tickets", { defaultValue: "Get Your Tickets" })}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {event.isFree ? t("events_free", { defaultValue: "Free" }) : `${t("event_starting_from", { defaultValue: "Starting from" })} $${event.price.toFixed(2)}`}
                  </span>
                  {isPast ? (
                    <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">{t("event_expired_badge", { defaultValue: "Expired" })}</span>
                  ) : (
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">{t("event_available_badge", { defaultValue: "Available" })}</span>
                  )}
                </div>
                {!isPast && (
                  <Link
                    href={orderUrl}
                    onClick={(e) => {
                      if (!currentUser) {
                        e.preventDefault();
                        router.push(`/login?redirect=${encodeURIComponent(orderUrl)}`);
                      }
                    }}
                    className="w-full flex items-center justify-center h-12 px-6 bg-[#1e3a8a] text-white text-lg font-bold rounded-2xl hover:bg-[#152c6c] transition-colors shadow-lg shadow-[#1e3a8a]/30 cursor-pointer"
                  >
                    {t("event_buy_tickets", { defaultValue: "Buy Tickets" })}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      router.push(`/login?redirect=${encodeURIComponent(eventUrl)}`);
                    } else {
                      setIsReportOpen(true);
                    }
                  }}
                  className="inline-flex items-center justify-center h-10 px-4 rounded-full text-sm font-semibold text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-200/70 dark:ring-red-500/60 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                >
                  {t("event_report", { defaultValue: "Report this event" })}
                </button>
                <Link
                  href="/events"
                  className="inline-flex items-center justify-center h-10 px-4 rounded-full text-primary ring-1 ring-inset ring-[#1e3a8a]/30 hover:bg-[#1e3a8a]/10 transition-colors cursor-pointer gap-2 font-semibold"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  {t("events_back_to_events", { defaultValue: "Back to Events" })}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportEventModal
        open={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        eventId={event.id}
        organizerId={(event as any).organizerId}
        reporterId={currentUser?.id}
      />
    </main>
  );
}
