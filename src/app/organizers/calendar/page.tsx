"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/features";
import { fetchEvents, fetchEventsByOrganizer } from "@/lib/features/eventSlice";
import { fetchCategories } from "@/lib/features/categorySlice";
import Link from "next/link";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import "./calendar-custom.css";
import { useTranslation } from 'react-i18next';

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Category colors for visual distinction
const CATEGORY_COLORS: Record<string, string> = {
  music: "bg-purple-500",
  sports: "bg-green-500",
  art: "bg-pink-500",
  technology: "bg-blue-500",
  business: "bg-orange-500",
  food: "bg-red-500",
  realestate: "bg-amber-500",
  medical: "bg-teal-500",
  default: "bg-primary"
};

export default function CalendarPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { events } = useSelector((state: RootState) => state.events);
  const categories = useSelector<RootState, Array<{ id?: string; name?: string }>>(
    (state) => state.categories.categories
  );
  const user = useSelector((state: RootState) => state.users.currentUser);
  const { t, i18n } = useTranslation('common');
  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  const daysLabels = useMemo(() => (t('organizer_calendar.days', { returnObjects: true }) as unknown as string[]) || DAYS, [t]);
  const monthsLabels = useMemo(() => (t('organizer_calendar.months', { returnObjects: true }) as unknown as string[]) || MONTHS, [t]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<(typeof events)[0] | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        const organizerId = u.uid || u.id;
        if (organizerId) {
          dispatch(fetchEventsByOrganizer(organizerId));
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    } else if (user?.id) {
      dispatch(fetchEventsByOrganizer(user.id));
    }
    dispatch(fetchCategories());
  }, [dispatch, user?.id]);

  // Get category color
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c: { id?: string; name?: string }) => c.id === categoryId);
    const categoryName = (category?.name || "").toLowerCase().replace(/\s+/g, "");
    return CATEGORY_COLORS[categoryName] || CATEGORY_COLORS.default;
  };

  // Safe date converter (handles Firestore Timestamp, Date, or string)
  const toDateSafe = (d: any): Date =>
    d instanceof Date ? d : d?.toDate ? d.toDate() : new Date(d);

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    
    return events.filter(event => {
      const eventDate = toDateSafe(event.startDate as any);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);
  const selectedEvents = useMemo(() => getEventsForDate(selectedDate), [events, selectedDate]);
  const today = new Date();

  const stats = useMemo(() => {
    const monthCount = events.filter(e => {
      const d = toDateSafe((e as any).startDate);
      return (
        d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear()
      );
    }).length;
    const upcomingCount = events.filter(e => {
      const d = toDateSafe((e as any).startDate);
      const now = new Date();
      return (
        d.getTime() > now.getTime() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;
    return [
      { label: t('organizer_calendar.stats.total_events'), value: events.length, iconBgClass: "bg-primary/10 text-primary" },
      { label: t('organizer_calendar.stats.this_month'), value: monthCount, iconBgClass: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300" },
      { label: t('organizer_calendar.stats.upcoming_this_month'), value: upcomingCount, iconBgClass: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" },
    ];
  }, [events, currentDate, t]);

  const StatCard: React.FC<{ label: string; value: number; iconBgClass: string; }> = ({ label, value, iconBgClass }) => (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-primary dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${iconBgClass}`}>
          <CalendarIcon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-neutral-900 dark:text-white min-h-screen w-full flex">
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="mx-auto max-w-7xl">
              {/* Breadcrumb */}
              <div className="mb-6 flex flex-wrap gap-2">
                <Link href="#" className="text-base font-medium text-neutral-400 hover:text-primary">
                  {t('Dashboard')}
                </Link>
                <span className="text-base font-medium text-neutral-400">/</span>
                <span className="text-base font-medium text-primary dark:text-white">{t('Calendar')}</span>
              </div>

              {/* Page Title */}
              <div className="mb-8 flex flex-wrap justify-between gap-3">
                <div className="flex min-w-72 flex-col gap-3">
                  <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-primary dark:text-white">
                    {t('organizer_calendar.title')}
                  </p>
                  <p className="text-base font-normal text-neutral-400">
                    {t('organizer_calendar.subtitle')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/organizers/events/create"
                    className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-white font-bold hover:bg-blue-800 cursor-pointer transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    {t('organizer_calendar.add_event')}
                  </Link>
                  <button
                    onClick={goToToday}
                    className="flex h-12 items-center justify-center gap-2 rounded-lg border border-primary text-primary px-6 font-bold hover:bg-primary hover:text-white cursor-pointer transition-colors"
                  >
                    <CalendarIcon className="h-5 w-5" />
                    {t('organizer_calendar.today')}
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {stats.map(s => (
                  <StatCard key={s.label} label={s.label} value={s.value} iconBgClass={s.iconBgClass} />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2">
                  <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
                      <h2 className="text-2xl font-bold text-primary dark:text-white">
                        {monthsLabels[currentDate.getMonth()]} {currentDate.getFullYear()}
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={goToPreviousMonth}
                          className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-primary hover:text-white hover:border-primary dark:hover:bg-primary transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={goToNextMonth}
                          className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-primary hover:text-white hover:border-primary dark:hover:bg-primary transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Days of week */}
                      <div className="grid grid-cols-7 gap-2 mb-3">
                        {daysLabels.map((day: string) => (
                          <div
                            key={day}
                            className="text-center text-sm font-bold text-neutral-600 dark:text-neutral-400 py-2"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-2">
                        {days.map((day, index) => {
                          if (!day) {
                            return <div key={`empty-${index}`} className="aspect-square" />;
                          }

                          const dayEvents = getEventsForDate(day);
                          const isToday =
                            day.getDate() === today.getDate() &&
                            day.getMonth() === today.getMonth() &&
                            day.getFullYear() === today.getFullYear();
                          const isSelected =
                            selectedDate &&
                            day.getDate() === selectedDate.getDate() &&
                            day.getMonth() === selectedDate.getMonth() &&
                            day.getFullYear() === selectedDate.getFullYear();

                          return (
                            <button
                              key={index}
                              onClick={() => setSelectedDate(day)}
                              className={`group relative aspect-square p-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                isSelected
                                  ? "bg-primary text-white shadow-lg scale-105 ring-2 ring-primary/50"
                                  : isToday
                                  ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary dark:from-primary/30 dark:to-primary/20 dark:text-primary-200 ring-2 ring-primary/30"
                                  : dayEvents.length > 0
                                  ? "bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20 hover:scale-105"
                                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:scale-105"
                              }`}
                            >
                              <div className="flex flex-col items-center justify-center h-full">
                                <span className={isSelected || isToday ? "font-bold" : ""}>
                                  {day.getDate()}
                                </span>
                                {dayEvents.length > 0 && (
                                  <div className="flex gap-1 mt-1.5">
                                    {dayEvents.slice(0, 3).map((event, i) => (
                                      <div
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                          isSelected 
                                            ? "bg-white" 
                                            : getCategoryColor(event.category)
                                        }`}
                                        title={event.title}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Tooltip on hover */}
                              {dayEvents.length > 0 && !isSelected && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  {dayEvents.length} {t(dayEvents.length === 1 ? 'organizer_calendar.event' : 'organizer_calendar.events')}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Category Legend */}
                      {categories.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">{t('organizer_calendar.categories')}</p>
                          <div className="flex flex-wrap gap-2">
                            {categories.slice(0, 6).map((category: { id?: string; name?: string }) => (
                              <div key={category.id} className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${getCategoryColor(category.id!)}`} />
                                <span className="text-xs text-neutral-600 dark:text-neutral-400">{category.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Events Sidebar */}
                <div className="lg:col-span-1">
                  <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
                    <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-primary/5 to-transparent">
                      <h3 className="text-xl font-bold text-primary dark:text-white">
                        {selectedDate
                          ? selectedDate.toLocaleDateString(locale, {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })
                          : t('organizer_calendar.select_a_date')}
                      </h3>
                      {selectedDate && selectedEvents.length > 0 && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          {selectedEvents.length} {t(selectedEvents.length === 1 ? 'organizer_calendar.event' : 'organizer_calendar.events')}
                        </p>
                      )}
                    </div>

                    <div className="p-4 max-h-[600px] overflow-y-auto calendar-events-scroll">
                      {selectedDate ? (
                        selectedEvents.length > 0 ? (
                          <div className="space-y-3">
                            {selectedEvents.map((event, idx) => (
                              <div
                                key={event.id}
                                onClick={() => { setSelectedEvent(event); setShowViewModal(true); }}
                                className="event-card-enter group cursor-pointer rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary dark:hover:border-primary hover:shadow-lg transition-all duration-200 overflow-hidden bg-white dark:bg-neutral-800"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                              >
                                {/* Event Image */}
                                {event.images && event.images.length > 0 && (
                                  <div className="relative h-32 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                                    <img
                                      src={event.images[0]}
                                      alt={event.title}
                                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                    <div className={`absolute top-2 left-2 ${getCategoryColor(event.category)} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                                      {categories.find((c: { id?: string; name?: string }) => c.id === event.category)?.name || t('organizer_calendar.event_fallback')}
                                    </div>
                                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
                                      {toDateSafe((event as any).startDate).toLocaleTimeString(locale, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Event Content */}
                                <div className="p-4">
                                  <h4 className="font-bold text-primary dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {event.title}
                                  </h4>
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
                                    {event.description}
                                  </p>
                                  
                                  {/* Event Details */}
                                  <div className="flex flex-wrap items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                                      <CalendarIcon className="h-3 w-3" />
                                      <span>
                                        {toDateSafe((event as any).startDate).toLocaleTimeString(locale, {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                    {event.isFree ? (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full font-medium">
                                        {t('free')}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 rounded-full font-medium">
                                        ${event.price}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                              <CalendarIcon className="h-10 w-10 text-neutral-400 dark:text-neutral-600" />
                            </div>
                            <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-1">
                              {t('organizer_calendar.no_events_scheduled')}
                            </p>
                            <p className="text-sm text-neutral-400 dark:text-neutral-500">
                              {t('organizer_calendar.this_day_available')}
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <CalendarIcon className="h-10 w-10 text-primary" />
                          </div>
                          <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                            {t('organizer_calendar.pick_a_date')}
                          </p>
                          <p className="text-sm text-neutral-400 dark:text-neutral-500">
                            {t('organizer_calendar.click_day_to_see')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* View Event Modal */}
      {showViewModal && selectedEvent && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h2 className="text-xl font-bold text-primary dark:text-white">{t('organizer_calendar.modal.title')}</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('organizer_calendar.modal.read_only')}</p>
              </div>
              <button
                aria-label="Close"
                onClick={() => setShowViewModal(false)}
                className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedEvent.images && selectedEvent.images.length > 0 && (
                <img
                  src={selectedEvent.images[0]}
                  alt={selectedEvent.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl font-bold text-primary dark:text-white">{selectedEvent.title}</h3>
                <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300">
                  {categories.find((c: { id?: string; name?: string }) => c.id === selectedEvent.category)?.name || t('organizer_calendar.event_fallback')}
                </span>
              </div>

              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {selectedEvent.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('organizer_calendar.modal.start')}</p>
                  <p className="text-sm font-semibold text-primary dark:text-white">
                    {toDateSafe((selectedEvent as any).startDate).toLocaleString(locale, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('organizer_calendar.modal.end')}</p>
                  <p className="text-sm font-semibold text-primary dark:text-white">
                    {toDateSafe((selectedEvent as any).endDate).toLocaleString(locale, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('organizer_calendar.modal.price')}</p>
                  <p className="text-sm font-semibold text-primary dark:text-white">
                    {selectedEvent.isFree || selectedEvent.price === 0 ? t('free') : `$${Number(selectedEvent.price).toFixed(2)}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-800"
              >
                {t('organizer_calendar.actions.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

