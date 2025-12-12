'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/features';
import { fetchEvents, fetchEventsByOrganizer, deleteEvent } from '@/lib/features/eventSlice';
import { fetchCategories } from '@/lib/features/categorySlice';
import { fetchVenues } from '@/lib/features/venueSlice';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';


const categoryColors: { [key: string]: string } = {
  Music: 'badge-music',
  Conference: 'badge-conference',
  Workshop: 'badge-workshop',
  Sports: 'badge-sports',
};

export default function AllEventsPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { events, loading, error } = useSelector((state: RootState) => state.events);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { venues } = useSelector((state: RootState) => state.venues);
  const user = useSelector((state: RootState) => state.users.currentUser);
  const { t, i18n } = useTranslation('common');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<typeof events[0] | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [ticketsSold, setTicketsSold] = useState<number | null>(null);
  const [ticketsLoading, setTicketsLoading] = useState<boolean>(false);
  const itemsPerPage = 4;

  // Notify blocked users on listing page
  useEffect(() => {
    if (user?.blocked) {
      Swal.fire({
        icon: 'info',
        title: t('blocked.title', { defaultValue: 'Account blocked' }),
        text: t('blocked.listing_events', { defaultValue: 'Your account is blocked, so creating new events is disabled.' }),
        confirmButtonColor: 'var(--color-primary-700)'
      });
    }
  }, [user?.blocked, t]);

  useEffect(() => {
    // Get organizer ID from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const organizerId = user.uid || user.id;
        if (organizerId) {
          dispatch(fetchEventsByOrganizer(organizerId));
        } else {
          dispatch(fetchEvents());
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        dispatch(fetchEvents());
      }
    } else {
      dispatch(fetchEvents());
    }
    
    dispatch(fetchCategories());
    dispatch(fetchVenues());
  }, [dispatch]);

  // Helper to create ID-to-name map
  const createMap = (items: any[], idKey: string, nameKey: string) => 
    items.reduce((map, item) => ({ ...map, [item[idKey]]: item[nameKey] }), {});

  const categoryMap = useMemo(() => createMap(categories, 'id', 'name'), [categories]);
  const venueMap = useMemo(() => createMap(venues, 'id', 'title'), [venues]);

  const getCategoryName = (id: string) => categoryMap[id] || id;
  const getVenueName = (id: string) => venueMap[id] || id;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return dateString;
    }
  };

  const toDateSafe = (d: any): Date => (d instanceof Date ? d : d?.toDate ? d.toDate() : new Date(d));
  const isPastEvent = (e: typeof events[0]) => {
    const end = toDateSafe((e as any).endDate);
    const start = toDateSafe((e as any).startDate);
    const ref = isNaN(end.getTime()) ? start : end;
    return ref.getTime() < Date.now();
  };

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const matchesSearch = event.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        if (statusFilter === 'upcoming') {
          return !isPastEvent(event);
        }

        return true;
      }),
    [events, searchQuery, statusFilter]
  );

  const { totalPages, startIndex, endIndex, currentEvents } = useMemo(() => {
    const total = Math.ceil(filteredEvents.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return {
      totalPages: total,
      startIndex: start,
      endIndex: end,
      currentEvents: filteredEvents.slice(start, end)
    };
  }, [filteredEvents, currentPage, itemsPerPage]);

  const handleView = (event: typeof events[0]) => {
    setSelectedEvent(event);
    setShowViewModal(true);
  };

  // Load tickets sold for selected event when modal opens
  useEffect(() => {
    let cancelled = false;
    const fetchTicketsSold = async () => {
      if (!showViewModal || !selectedEvent?.id) {
        setTicketsSold(null);
        return;
      }
      try {
        setTicketsLoading(true);
        const q = query(
          collection(db, 'orders'),
          where('eventId', '==', selectedEvent.id),
          where('status', '==', 'confirmed')
        );
        const snap = await getDocs(q);
        let total = 0;
        snap.forEach((docSnap) => {
          const data: any = docSnap.data();
          const qty = Number(data?.quantity ?? 0);
          if (!isNaN(qty)) total += qty;
        });
        if (!cancelled) setTicketsSold(total);
      } catch (e) {
        if (!cancelled) setTicketsSold(0);
      } finally {
        if (!cancelled) setTicketsLoading(false);
      }
    };
    fetchTicketsSold();
    return () => {
      cancelled = true;
    };
  }, [showViewModal, selectedEvent?.id]);

  const handleDeleteClick = async (id: string) => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('eventId', '==', id),
        where('status', '==', 'confirmed')
      );
      const snap = await getDocs(q);
      const hasConfirmedOrders = !snap.empty;

      if (hasConfirmedOrders) {
        await Swal.fire({
          title: t('organizer_events.delete_linked_title', {
            defaultValue:
              i18n.language === 'ar' ? 'لا يمكن حذف هذا الحدث' : 'Cannot delete this event',
          }),
          text: t('organizer_events.delete_linked_text', {
            defaultValue:
              i18n.language === 'ar'
                ? 'لا يمكن حذف حدث تم حجز تذاكر له. قم بإدارة أو إلغاء الطلبات المرتبطة أولاً قبل حذف الحدث.'
                : 'This event has ticket orders. Please manage or cancel those orders first before deleting the event.',
          }),
          icon: 'warning',
          confirmButtonColor: 'var(--color-primary-700)',
        });
        return;
      }
    } catch (e) {
      // لو فشل جلب الطلبات، نرجع لسلوك التأكيد العادي بدون فحص إضافي
    }

    const result = await Swal.fire({
      title: t('organizer_events.delete_confirm.title'),
      text: t('organizer_events.delete_confirm.text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('organizer_events.delete_confirm.confirm'),
      cancelButtonText: t('organizer_events.delete_confirm.cancel'),
      confirmButtonColor: 'red',
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteEvent(id)).unwrap();
        await Swal.fire({
          title: t('organizer_events.delete_toast.deleted_title'),
          text: t('organizer_events.delete_toast.deleted_text'),
          icon: 'success',
          confirmButtonColor: 'var(--color-primary-700)',
        });
      } catch (error) {
        await Swal.fire({
          title: t('organizer_events.delete_toast.error_title'),
          text: t('organizer_events.delete_toast.error_text'),
          icon: 'error',
          confirmButtonColor: 'var(--color-primary-700)',
        });
      }
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="p-8 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-subtitle">{t('organizer_events.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-base font-medium text-neutral-400">
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            {t('Dashboard')}
          </Link>
          <span>/</span>
          <span className="text-primary dark:text-white">{t('Events')}</span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em] text-primary dark:text-white mb-2">{t('organizer_events.title')}</h1>
            <p className="text-sm sm:text-base font-normal text-neutral-400">{t('organizer_events.subtitle')}</p>
          </div>
          {user && !user.blocked && (
            <Link href="/organizers/events/create" className="flex h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-base font-bold sm:w-auto bg-[var(--color-primary-700)] text-white transition cursor-pointer hover:bg-[var(--color-primary-800)]">
              <PlusCircleIcon className="h-6 w-6" />
              <span>{t('organizer_events.add_new')}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Search + Status Filter */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative max-w-md w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subtitle" size={20} />
            <input
              type="text"
              placeholder={t('organizer_events.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs sm:text-sm rounded-full font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[var(--color-primary-700)] text-white'
                  : 'bg-transparent text-subtitle'
              }`}
            >
              {i18n.language === 'ar'
                ? t('organizer_events.filters.all', { defaultValue: 'الكل' })
                : t('organizer_events.filters.all', { defaultValue: 'All' })}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1 text-xs sm:text-sm rounded-full font-medium transition-colors ${
                statusFilter === 'upcoming'
                  ? 'bg-[var(--color-primary-700)] text-white'
                  : 'bg-transparent text-subtitle'
              }`}
            >
              {i18n.language === 'ar'
                ? t('organizer_events.filters.upcoming', { defaultValue: 'القادمة' })
                : t('organizer_events.filters.upcoming', { defaultValue: 'Upcoming' })}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="table-header-cell">{t('organizer_events.table_headers.title')}</th>
                <th className="table-header-cell">{t('organizer_events.table_headers.start_date')}</th>
                <th className="table-header-cell">{t('organizer_events.table_headers.end_date')}</th>
                <th className="table-header-cell">{t('organizer_events.table_headers.venue')}</th>
                <th className="table-header-cell">{t('organizer_events.table_headers.category')}</th>
                <th className="table-header-cell">{t('organizer_events.table_headers.price')}</th>
                <th className="table-header-cell">{t('organizer_events.table_headers.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentEvents.map((event) => (
                <tr key={event.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      {event.images && event.images.length > 0 ? (
                        <img 
                          src={event.images[0]} 
                          alt={event.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-200)] flex-shrink-0 flex items-center justify-center">
                          <span className="text-[var(--color-primary-700)] font-bold text-lg">{event.title.charAt(0)}</span>
                        </div>
                      )}
                      <span className="font-medium text-normal">{event.title}</span>
                    </div>
                  </td>
                  <td className="table-cell">{formatDate(event.startDate)}</td>
                  <td className="table-cell">{formatDate(event.endDate)}</td>
                  <td className="table-cell">{getVenueName(event.venue)}</td>
                  <td className="table-cell">
                    <span
                      className={`badge ${
                        categoryColors[getCategoryName(event.category)] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {getCategoryName(event.category)}
                    </span>
                  </td>
                  <td className="table-cell font-semibold text-normal">
                    {event.isFree || event.price === 0 ? (
                      <span className="text-green-600">{t('free')}</span>
                    ) : (
                      `$${Number(event.price).toFixed(2)}`
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleView(event)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer text-primary" 
                        title={t('organizer_events.actions.view')}
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <Link 
                        href={`/organizers/events/edit/${event.id}`}
                        aria-disabled={isPastEvent(event)}
                        className={`p-2 rounded-lg transition text-primary ${isPastEvent(event) ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-gray-100 cursor-pointer'}`} 
                        title={t('organizer_events.actions.edit')}
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </Link>
                      <button
                        disabled={isPastEvent(event)}
                        onClick={() => !isPastEvent(event) && event.id && handleDeleteClick(event.id)}
                        className={`p-2 rounded-lg transition text-primary ${isPastEvent(event) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}`}
                        title={t('organizer_events.actions.delete')}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination for Desktop */}
        <div className="px-6 py-4 flex items-center justify-between border-t" style={{borderColor: 'var(--color-border)'}}>
          <div className="text-sm text-subtitle">
            {t('organizer_events.pagination_summary', { start: startIndex + 1, end: Math.min(endIndex, filteredEvents.length), total: filteredEvents.length })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-nav-btn"
            >
              <ChevronLeft size={20} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`pagination-btn ${
                  currentPage === page ? 'pagination-btn-active' : ''
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-nav-btn"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="lg:hidden space-y-4">
        {currentEvents.map((event) => (
          <div
            key={event.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {/* Event Header */}
            <div className="flex items-start gap-3 mb-4">
              {event.images && event.images.length > 0 ? (
                <img 
                  src={event.images[0]} 
                  alt={event.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-200)] flex-shrink-0 flex items-center justify-center">
                  <span className="text-[var(--color-primary-700)] font-bold text-2xl">{event.title.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-normal text-lg mb-1 line-clamp-2">
                  {event.title}
                </h3>
                <span
                  className={`badge text-xs ${
                    categoryColors[getCategoryName(event.category)] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {getCategoryName(event.category)}
                </span>
              </div>
            </div>

            {/* Event Info */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-subtitle">
                <span className="font-medium">📅</span>
                <span>{formatDate(event.startDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-subtitle">
                <span className="font-medium">📍</span>
                <span>{getVenueName(event.venue)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-subtitle">
                <span className="font-medium">💰</span>
                <span className="font-semibold">
                  {event.isFree || event.price === 0 ? (
                    <span className="text-green-600">{t('free')}</span>
                  ) : (
                    `$${Number(event.price).toFixed(2)}`
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button 
                onClick={() => handleView(event)}
                className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2 text-sm"
              >
                <EyeIcon className="h-4 w-4" />
                <span>{t('organizer_events.actions.view')}</span>
              </button>
              <Link 
                href={`/organizers/events/edit/${event.id}`}
                aria-disabled={isPastEvent(event)}
                className={`flex-1 btn-secondary flex items-center justify-center gap-2 py-2 text-sm ${isPastEvent(event) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              >
                <PencilSquareIcon className="h-4 w-4" />
                <span>{t('organizer_events.actions.edit')}</span>
              </Link>
              <button
                disabled={isPastEvent(event)}
                onClick={() => !isPastEvent(event) && event.id && handleDeleteClick(event.id)}
                className={`flex-1 rounded-lg flex items-center justify-center gap-2 py-2 text-sm transition-colors ${isPastEvent(event) ? 'opacity-50 cursor-not-allowed bg-red-50 text-red-400' : 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400'}`}
              >
                <TrashIcon className="h-4 w-4" />
                <span>{t('organizer_events.actions.delete')}</span>
              </button>
            </div>
          </div>
        ))}

        {/* Mobile Pagination */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-sm text-subtitle text-center mb-4">
            {t('organizer_events.pagination_summary', { start: startIndex + 1, end: Math.min(endIndex, filteredEvents.length), total: filteredEvents.length })}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-nav-btn"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`pagination-btn ${
                    currentPage === page ? 'pagination-btn-active' : ''
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-nav-btn"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

    {/* View Event Modal */}
    {showViewModal && selectedEvent && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowViewModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full shadow-2xl transform transition-all animate-slideUp" onClick={(e) => e.stopPropagation()}>
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[var(--color-primary-700)] to-[var(--color-primary-600)] p-6 rounded-t-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{t('organizer_events.modal.title')}</h2>
                <p className="text-white/80 text-sm">{t('organizer_events.modal.subtitle')}</p>
              </div>
              <button 
                onClick={() => setShowViewModal(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Title and Category */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-2xl font-bold text-primary dark:text-white">{selectedEvent.title}</h3>
                <span className={`badge text-sm px-4 py-1.5 ${categoryColors[getCategoryName(selectedEvent.category)] || 'bg-gray-100 text-gray-700'}`}>
                  {getCategoryName(selectedEvent.category)}
                </span>
              </div>
              
              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-[var(--color-primary-50)] dark:bg-gray-700/50 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-[var(--color-primary-600)] dark:text-primary-300 uppercase tracking-wide mb-1">{t('organizer_events.modal.start_label')}</p>
                  <p className="text-base font-semibold text-normal dark:text-white">{formatDate(selectedEvent.startDate)}</p>
                </div>
                <div className="bg-[var(--color-primary-50)] dark:bg-gray-700/50 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-[var(--color-primary-600)] dark:text-primary-300 uppercase tracking-wide mb-1">{t('organizer_events.modal.end_label')}</p>
                  <p className="text-base font-semibold text-normal dark:text-white">{formatDate(selectedEvent.endDate)}</p>
                </div>
                <div className="bg-[var(--color-primary-50)] dark:bg-gray-700/50 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-[var(--color-primary-600)] dark:text-primary-300 uppercase tracking-wide mb-1">{t('organizer_events.modal.venue_label')}</p>
                  <p className="text-base font-semibold text-normal dark:text-white">{getVenueName(selectedEvent.venue)}</p>
                </div>
                <div className="bg-[var(--color-primary-50)] dark:bg-gray-700/50 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-[var(--color-primary-600)] dark:text-primary-300 uppercase tracking-wide mb-1">{t('organizer_events.modal.price_label')}</p>
                  <p className="text-lg font-bold text-normal dark:text-white">
                    {selectedEvent.isFree || selectedEvent.price === 0 ? (
                      <span className="text-green-600 dark:text-green-400">{t('organizer_events.modal.free_event')}</span>
                    ) : (
                      <span className="text-[var(--color-primary-700)] dark:text-primary-300">${Number(selectedEvent.price).toFixed(2)}</span>
                    )}
                  </p>
                </div>
                <div className="sm:col-span-2 flex justify-center">
                  <div className="bg-[var(--color-primary-50)] dark:bg-gray-700/50 p-4 rounded-xl w-full sm:w-1/2 text-center">
                    <p className="text-xs font-semibold text-[var(--color-primary-600)] dark:text-primary-300 uppercase tracking-wide mb-1">
                      {t('organizer_events.modal.tickets_sold_label', { defaultValue: 'Tickets sold' })}
                    </p>
                    <p className="text-2xl font-extrabold text-normal dark:text-white">
                      {ticketsLoading ? '...' : (ticketsSold ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button 
              onClick={() => setShowViewModal(false)}
              className="px-6 py-2.5 bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-800)] text-white font-semibold rounded-lg transition-colors"
            >
              {t('organizer_events.actions.close')}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
