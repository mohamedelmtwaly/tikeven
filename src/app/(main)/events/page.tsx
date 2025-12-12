"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  MapPinIcon,
  GlobeAltIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  TagIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Loading from "./loading";

import { useSelector, useDispatch } from "react-redux";
import { getAllEvents } from "@/lib/events/eventSlice";
import { fetchVenues, Venue } from "@/lib/features/venueSlice";
import { fetchCategories } from "@/lib/features/categorySlice";

interface Event {
  id: string;
  title: string;
  venue: string;
  category: string;
  price: number;
  image: string;

  startDate: string; // ISO
  endDate: string; // ISO
  descriptionOrganizer: string;
  isFree: boolean;
}

export default function EventPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [mode, setMode] = useState<"all" | "online" | "offline">("all");
  const [cost, setCost] = useState<"all" | "free" | "paid">("all");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Get category from URL query params
  useEffect(() => {
    const category = searchParams?.get("category");
    if (category) {
      setSelectedCategory(category);
    } else {
      setSelectedCategory(null);
    }
  }, [searchParams]);

  const router = useRouter();

  let dispatch = useDispatch();

  let { allEvents, loading, error } = useSelector(
    (state: any) => state.eventsInfo
  );
  const { venues } = useSelector(
    (state: any) => state.venues || { venues: [] }
  );
  const { categories } = useSelector(
    (state: any) => state.categories || { categories: [] }
  );
  const { currentUser } = useSelector(
    (state: any) => state.users || { currentUser: null }
  );

  console.log(allEvents, loading, error);

  function extractDMYFromISO(iso: string): { d: number; m: number; y: number } {
    const dt = new Date(iso);
    return { d: dt.getDate(), m: dt.getMonth() + 1, y: dt.getFullYear() };
  }

  function formatDateTime(iso: string): string {
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
    const dt = new Date(iso);
    const opts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return new Intl.DateTimeFormat("en-US", opts).format(dt);
  }

  const venueAddressMap = useMemo(() => {
    const map: Record<string, string> = {};
    (venues as Venue[] | undefined)?.forEach((v) => {
      if (v && v.id) {
        map[v.id] = v.address;
      }
    });
    return map;
  }, [venues]);

  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    (categories as any[] | undefined)?.forEach((c: any) => {
      if (c && c.id) {
        map[c.id] = c.name;
      }
    });
    return map;
  }, [categories]);

  const filteredEvents = (allEvents as Event[]).filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const isOnline = /online/i.test(event.venue);
    const matchesMode =
      mode === "all" || (mode === "online" ? isOnline : !isOnline);
    const matchesCost =
      cost === "all" || (cost === "free" ? event.price === 0 : event.price > 0);
    const matchesCategory =
      !selectedCategory || event.category === selectedCategory;
    let matchesExactDate = true;
    if (day && month && year) {
      const { d, m, y } = extractDMYFromISO(event.startDate);
      const dd = parseInt(day, 10);
      const mm = parseInt(month, 10);
      const yy = parseInt(year, 10);
      matchesExactDate = d === dd && m === mm && y === yy;
    }
    return (
      matchesSearch &&
      matchesMode &&
      matchesCost &&
      matchesExactDate &&
      matchesCategory
    );
  }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());;

  useEffect(() => {
    dispatch(getAllEvents() as any);
    dispatch(fetchVenues() as any);
    dispatch(fetchCategories() as any);
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, mode, cost, day, month, year]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEvents = filteredEvents.slice(
    startIndex,
    startIndex + pageSize
  );

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* <div>{allEvents.map((event)=> <p>{event.id}</p>)}</div> */}
      <section className="mb-12 text-center">
        <h2 className="text-4xl md:text-5xl font-display text-primary dark:text-white">
          {t("events_find_experience", {
            defaultValue: "Find Your Next Experience",
          })}
        </h2>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          {t("events_discover_interests", {
            defaultValue: "Discover events for all your interests.",
          })}
        </p>
        <div className="mt-8 max-w-2xl mx-auto relative">
          <input
            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-full focus:ring-blue-700 focus:border-blue-700 dark:bg-gray-800 dark:text-white transition-shadow duration-300 shadow-sm focus:shadow-lg"
            placeholder={t("events_search_placeholder", {
              defaultValue: "Search for events, artists, or venues...",
            })}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <MagnifyingGlassIcon className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
      </section>

      {/* Inline Filters: Segmented controls with icons (compact, responsive) */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="w-auto">
            <div className="relative inline-flex items-center rounded-full ring-1 ring-inset ring-gray-300 overflow-hidden bg-white shadow-sm pl-2 pr-7 py-1.5 dark:bg-gray-800">
              <span className="text-xs font-semibold mr-2 bg-[#1e3a8a] text-white rounded-full px-2 py-0.5">
                {t("events_date", { defaultValue: "Date" })}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={day}
                onChange={(e) =>
                  setDay(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
                }
                placeholder="dd"
                className="w-9 bg-transparent outline-none text-xs sm:text-sm text-gray-800 dark:text-white text-center"
              />
              <span className="mx-1 text-gray-400">/</span>
              <input
                type="text"
                inputMode="numeric"
                value={month}
                onChange={(e) =>
                  setMonth(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
                }
                placeholder="mm"
                className="w-9 bg-transparent outline-none text-xs sm:text-sm text-gray-800 dark:text-white text-center"
              />
              <span className="mx-1 text-gray-400">/</span>
              <input
                type="text"
                inputMode="numeric"
                value={year}
                onChange={(e) =>
                  setYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                }
                placeholder="yyyy"
                className="w-12 bg-transparent outline-none text-xs sm:text-sm text-gray-800 dark:text-white text-center"
              />
              <button
                type="button"
                onClick={() => {
                  setDay("");
                  setMonth("");
                  setYear("");
                }}
                title="Reset date filter"
                className="ml-2 text-xs font-semibold bg-[#1e3a8a] text-white rounded-full px-2 py-0.5 hover:bg-[#152c6c] transition-colors cursor-pointer whitespace-nowrap"
              >
                {t("events_all", { defaultValue: "All" })}
              </button>
              <CalendarDaysIcon className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Price segmented */}
          <div
            role="group"
            aria-label="Price"
            className="inline-flex rounded-full ring-1 ring-inset ring-gray-300 bg-white shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setCost("all")}
              aria-pressed={cost === "all"}
              className={
                "px-3 py-1.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer " +
                (cost === "all"
                  ? " bg-[#1e3a8a] text-white"
                  : " text-gray-700 hover:bg-gray-50")
              }
            >
              <TagIcon className="w-4 h-4" />
              <span>{t("events_all", { defaultValue: "All" })}</span>
            </button>
            <button
              onClick={() => setCost("free")}
              aria-pressed={cost === "free"}
              className={
                "px-3 py-1.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border-l border-gray-200 cursor-pointer " +
                (cost === "free"
                  ? " bg-[#1e3a8a] text-white"
                  : " text-gray-700 hover:bg-gray-50")
              }
            >
              <TagIcon className="w-4 h-4" />
              <span>{t("events_free", { defaultValue: "Free" })}</span>
            </button>
            <button
              onClick={() => setCost("paid")}
              aria-pressed={cost === "paid"}
              className={
                "px-3 py-1.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border-l border-gray-200 cursor-pointer " +
                (cost === "paid"
                  ? " bg-[#1e3a8a] text-white"
                  : " text-gray-700 hover:bg-gray-50")
              }
            >
              <CurrencyDollarIcon className="w-4 h-4" />
              <span>{t("events_paid", { defaultValue: "Paid" })}</span>
            </button>
          </div>
          {/* Category filter */}
          <div className="relative inline-block text-left">
            <div>
              <button
                type="button"
                className="inline-flex justify-between items-center w-full rounded-full px-4 py-1.5 bg-white text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
                id="category-menu"
                aria-expanded="true"
                aria-haspopup="true"
                onClick={() =>
                  document
                    .getElementById("category-dropdown")
                    ?.classList.toggle("hidden")
                }
              >
                {selectedCategory
                  ? categoryNameMap[selectedCategory] || "Select Category"
                  : "All Categories"}
                <svg
                  className="-mr-1 ml-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div
              id="category-dropdown"
              className="hidden origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
            >
              <div
                className="py-1"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="category-menu"
              >
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    document
                      .getElementById("category-dropdown")
                      ?.classList.add("hidden");
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    !selectedCategory
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  role="menuitem"
                >
                  All Categories
                </button>
                {categories?.map((category: any) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      document
                        .getElementById("category-dropdown")
                        ?.classList.add("hidden");
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      selectedCategory === category.id
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    role="menuitem"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading || !allEvents || allEvents.length === 0 ? (
        <Loading />
      ) : filteredEvents.length === 0 ? (
        <div className="mt-6 flex justify-center">
          <div className="w-full max-w-2xl rounded-2xl border-2 border-blue-800/20 bg-white dark:bg-gray-900/40 p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1e3a8a]/10">
              <ExclamationTriangleIcon className="h-6 w-6 text-[#1e3a8a]" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-[#1e3a8a]">
              {t("events_no_results", { defaultValue: "No matching results" })}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {t("events_adjust_filters", {
                defaultValue: "Try adjusting your filters or search terms.",
              })}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {paginatedEvents.map((event) => {
            const categoryLabel = categoryNameMap[event.category] || "Event";
            const isPast = (() => {
              try {
                return new Date(event.endDate).getTime() < Date.now();
              } catch {
                return false;
              }
            })();
            return (
              <Link
                prefetch={false}
                key={event.id}
                href={`/events/${encodeURIComponent(String(event.id))}`}
                className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={
                      event.image && event.image.trim() !== ""
                        ? event.image
                        : "/logo.png"
                    }
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/logo.png";
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-indigo-100 dark:bg-indigo-400 text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
                    {categoryLabel}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-primary dark:text-white leading-tight mb-2">
                    {event.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CalendarDaysIcon className={`w-4 h-4 ${isPast ? 'text-red-500' : 'text-gray-500'}`} />
                      <span className={` my-2 text-sm ${isPast ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
                        {formatShortDate(event.startDate)}
                        {isPast && (
                          <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">
                            Expired
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <MapPinIcon className="w-4 h-4 mr-1.5" />
                    <span>{venueAddressMap[event.venue] || event.venue}</span>
                  </div>
                  <div className="mt-auto flex justify-between items-center">
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {event.price === 0 ? (
                        <span className="text-green-600 dark:text-green-400">
                          {t("events_free", { defaultValue: "Free" })}
                        </span>
                      ) : (
                        <>
                          <span className="text-primary">
                            {t("events_from", { defaultValue: "From" })}{" "}
                          </span>
                          <span className="text-primary">
                            ${"" + event.price}
                          </span>
                        </>
                      )}
                    </p>
                    {!isPast && (
                      <span
                        className="rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm bg-[#1e3a8a] group-hover:bg-[#152c6c] text-white"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const orderUrl = `/events/${event.id}/order`;
                          if (!currentUser) {
                            router.push(
                              `/login?redirect=${encodeURIComponent(orderUrl)}`
                            );
                          } else {
                            router.push(orderUrl);
                          }
                        }}
                      >
                        {t("events_get_tickets", {
                          defaultValue: "Get Tickets",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <nav
        aria-label="Pagination"
        className="mt-10 flex items-center justify-center gap-2"
      >
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset ring-[#1e3a8a]/40 text-[#1e3a8a] bg-white hover:bg-[#e0ebff] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white disabled:text-gray-400"
        >
          {t("common_previous", { defaultValue: "Prev" })}
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            aria-current={currentPage === page ? "page" : undefined}
            className={
              "inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold ring-1 ring-inset transition-colors " +
              (currentPage === page
                ? "bg-[#1e3a8a] text-white ring-[#1e3a8a] shadow-sm"
                : "bg-white text-gray-700 ring-gray-300 hover:bg-[#e0ebff] hover:text-[#1e3a8a]")
            }
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset ring-[#1e3a8a]/40 text-[#1e3a8a] bg-white hover:bg-[#e0ebff] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white disabled:text-gray-400"
        >
          {t("common_next", { defaultValue: "Next" })}
        </button>
      </nav>
    </main>
  );
}
