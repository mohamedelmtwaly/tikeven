"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { TicketIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/features";
import { fetchOrders, updateOrderReview, TicketOrder } from "@/lib/features/orderSlice";
import Spinner from "@/components/Spinner";
import { useTranslation } from "react-i18next";
import OrderReviewForm from "@/components/OrderReviewForm";

// Move renderOrderReview outside the component to avoid conditional hooks
const renderOrderReview = (
  order: TicketOrder & { isCompleted?: boolean },
  t: (key: string) => string,
  openReviewForm: (orderId: string, isEdit: boolean, e?: React.MouseEvent) => void
) => {
  const isCompleted = order.isCompleted || false;
  
  if (order.review) {
    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('reviews.your_review')}
            </h4>
            <div className="flex items-center ml-3">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-5 w-5 ${i < (order.review?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
          </div>
          {isCompleted && (
            <button
              onClick={(e) => openReviewForm(order.id, true, e)}
              className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200"
            >
              {t('common.edit')}
            </button>
          )}
        </div>
        {order.review.comment && (
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {order.review.comment}
          </p>
        )}
      </div>
    );
  }

  if (!isCompleted) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-2 sm:mb-0">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {t('reviews.share_experience')}
          </h4>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {t('reviews.help_others')}
          </p>
        </div>
        <button
          onClick={(e) => openReviewForm(order.id, false, e)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap transform hover:scale-[1.02] active:scale-95"
        >
          <StarIcon className="h-4 w-4" />
          {t('reactions.leave_review')}
        </button>
      </div>
    </div>
  );
};

export default function OrdersPage() {
  // All hooks must be called unconditionally at the top level
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, reviewStatus } = useSelector((state: RootState) => state.orders);
  const { currentUser } = useSelector((state: RootState) => state.users);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [activeReview, setActiveReview] = useState<{orderId: string; isEdit: boolean} | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const hasAutoOpened = useRef(false);
  const { t } = useTranslation("common");
  
  // Handle initial mount and loading state
  useEffect(() => {
    setIsMounted(true);
    return () => {
      // Cleanup function to restore original style
      document.body.style.overflow = 'auto';
      setIsMounted(false);
    };
  }, []);
  
  // Handle body overflow when modal is open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (activeReview) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // No need for cleanup here as we handle it in the mount effect
  }, [activeReview]);
  
  // Get categories with counts from orders, filtered by current status
  const categoriesWithCounts = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    const categoryMap = new Map<string, number>();
    
    orders.forEach(order => {
      // For 'all' filter, include all confirmed orders regardless of isUpcoming status
      const matchesStatus = 
        filter === 'all' 
          ? order.status === 'confirmed'
          : order.status === 'confirmed' && 
            (filter === 'upcoming' ? (order.isUpcoming ?? true) : !(order.isUpcoming ?? true));
      
      if (order.category && matchesStatus) {
        const count = categoryMap.get(order.category) || 0;
        categoryMap.set(order.category, count + 1);
      }
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [orders, filter]);

  const filteredAndSearchedOrders = useMemo(() => {
    if (!orders?.length) return [];

    const filtered = orders.map(order => {
      const eventDate = order.eventData?.date || order.eventDate;
      const eventEnded = eventDate ? new Date(eventDate) < new Date() : false;
      return {
        ...order,
        isCompleted: eventEnded
      };
    }).filter((order) => {
      // Allow only REAL confirmed orders (explicit check)
      const isConfirmed = order.status === "confirmed";

      let matchesStatus = false;

      if (filter === "all") {
        matchesStatus = isConfirmed;
      } 
      else if (filter === "upcoming") {
        matchesStatus = isConfirmed && !order.isCompleted;
      } 
      else if (filter === "completed") {
        matchesStatus = isConfirmed && order.isCompleted;
      }

      // category filter
      const matchesCategory =
        selectedCategory === "all" ||
        order.category === selectedCategory;

      return matchesStatus && matchesCategory;
    });
    
    console.log('Filtered orders:', filtered);
    return filtered;
  }, [orders, filter, selectedCategory]);



  useEffect(() => {
      dispatch(fetchOrders(currentUser?.id));
  }, [dispatch, currentUser?.id]);

  useEffect(() => {
    if (!hasAutoOpened.current && orders && orders.length > 0) {
      setActiveAccordion(orders[0].id);
      hasAutoOpened.current = true;
    }
  }, [orders]);

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const handleReviewSubmit = async (orderId: string, review: { rating: number; comment: string }) => {
    try {
      setIsSubmittingReview(true);
      const order = orders?.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }
      
      await dispatch(updateOrderReview({
        orderId,
        eventId: order.eventId,
        review: {
          rating: review.rating,
          comment: review.comment,
          userId: currentUser?.id || '',
          userName: currentUser?.name || 'Anonymous',
          userAvatar: currentUser?.image || ''
        }
      }));
      
      // Refresh orders to show the new review
      await dispatch(fetchOrders(currentUser?.id));
      
      // Close the review form
      closeReviewForm();
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const openReviewForm = (orderId: string, isEdit = false, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveReview({ orderId, isEdit });
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const closeReviewForm = () => {
    if (!isSubmittingReview) {
      setActiveReview(null);
      document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
  };

  // Find the active order for the review modal
  const activeOrder = useMemo(() => {
    return activeReview ? orders?.find(order => order.id === activeReview.orderId) : null;
  }, [activeReview, orders]);
  
  // Handle loading state
  useEffect(() => {
    if (isMounted) {
      if (!loading) {
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [loading, isMounted]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark flex flex-col">
      {/* Review Form Modal */}
      {activeReview && activeOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={closeReviewForm}
            />
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
              <div className="absolute right-4 top-4">
                <button
                  onClick={closeReviewForm}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <OrderReviewForm
                orderId={activeOrder.id}
                eventName={activeOrder.eventName}
                onReviewSubmit={async (review) => {
                  try {
                    await handleReviewSubmit(activeOrder.id, review);
                  } catch (error) {
                    console.error('Error in review submission:', error);
                    throw error; // Re-throw to let the form handle the error
                  }
                }}
                onCancel={closeReviewForm}
                isSubmitting={reviewStatus === 'loading' || isSubmittingReview}
                initialRating={activeReview.isEdit && activeOrder.review ? activeOrder.review.rating : 0}
                initialComment={activeReview.isEdit && activeOrder.review ? activeOrder.review.comment : ''}
              />
            </div>
          </div>
        </div>
      )}
      {/* MAIN */}
      <main className="flex-grow py-12">
        <div className="container mx-auto px-6 max-w-7xl">

          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-4xl font-bold text-primary dark:text-white">
              {t("orders")}
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 mt-8">
            {/* Filters Card */}
            <div className="lg:w-72 flex-shrink-0">
              <div className="bg-white dark:bg-subtle-dark rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 h-fit sticky top-6">
                <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">{t("filters.title")}</h3>
                
                <div className="space-y-4">
                  {/* Status Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("filters.status")}</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                          checked={filter === 'upcoming'}
                          onChange={() => setFilter('upcoming')}
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {t("orders_page.upcoming")}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                          checked={filter === 'completed'}
                          onChange={() => setFilter('completed')}
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {t("orders_page.completed")}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                          checked={filter === 'all'}
                          onChange={() => setFilter('all')}
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {t("filters.all")}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("filters.event_type")}
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                          checked={selectedCategory === 'all'}
                          onChange={() => setSelectedCategory('all')}
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {t("filters.all_categories")}
                        </span>
                      </label>
                      {categoriesWithCounts.map(({ name, count }) => (
                        <label key={name} className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="category"
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                              checked={selectedCategory === name}
                              onChange={() => setSelectedCategory(name)}
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              {name}
                            </span>
                          </div>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                            {count}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* <button className="mt-6 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  {t("filters.apply_filters")}
                </button> */}
              </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 space-y-6">
            {(!orders || orders.length === 0) && (
              <div className="flex justify-center">
                <div className="w-full max-w-xl lg:max-w-3xl rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-subtle-dark/70 px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-20 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <TicketIcon className="h-6 w-6" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t("orders_page.empty_title")}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {t("orders_page.empty_description")}
                  </p>
                </div>
              </div>
            )}
            {orders && orders.length > 0 && 
              filteredAndSearchedOrders
              .sort((a, b) => {
                const dateA = a.eventData?.date ? new Date(a.eventData.date).getTime() : 0;
                const dateB = b.eventData?.date ? new Date(b.eventData.date).getTime() : 0;
                return dateB - dateA;
              })
              .map((order, i) => (
              <div
                key={order.id}
                className="bg-white dark:bg-subtle-dark rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:[transform:rotateY(-5deg)_scale(1.02)] transition-transform duration-300"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div 
                  onClick={() => toggleAccordion(order?.id)}
                  className="w-full cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4">
                    {/* Event Image */}
                    <div className="w-full sm:w-28 h-40 sm:h-28 flex-shrink-0">
                      <Image
                        src={order.eventData?.image || "/placeholder.png"}
                        alt={order.eventName || "Event"}
                        width={120}
                        height={120}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Event Details */}
                    <div className="flex-grow w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center flex-wrap gap-2">

                            {/* Event Name */}
                            <h2 className="text-lg sm:text-xl font-semibold text-primary dark:text-white">
                              {order.eventName || t("orders_page.untitled_event")}
                            </h2>

                            {/* Statuses + Review */}
                            <div className="flex items-center gap-2 my-2">

                              {/* Order Status */}
                              <span
                                className={`text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border font-medium ${
                                  order.status === "confirmed"
                                    ? "border-blue-500 text-blue-600"
                                    : order.status === "pending"
                                    ? "border-yellow-500 text-yellow-600"
                                    : "border-red-500 text-red-600"
                                }`}
                              >
                                {order.status}
                              </span>

                              {/* Upcoming / Completed */}
                              <span
                                className={`text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border font-medium ${
                                  !order.isCompleted
                                    ? "border-green-500 text-green-600"
                                    : "border-gray-400 text-gray-500"
                                }`}
                              >
                                {!order.isCompleted
                                  ? t("orders_page.status_upcoming")
                                  : t("orders_page.status_completed")}
                              </span>

                              {/* Review Button */}
                              {order.isCompleted && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openReviewForm(order.id, false, e);
                                  }}
                                  className="flex items-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer"
                                  title={t('reactions.leave_review')}
                                >
                                  <StarIcon className="h-3 w-3" />
                                  <span>{t('reviews.review')}</span>
                                </div>
                              )}

                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Created At */}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t("orders_page.ordered_on_label")} {" "}
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "—"}
                      </p>

                      {/* Event Date */}
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="font-medium">
                          {t("orders_page.event_date_label")} {" "}
                        </span>
                        {order.eventData?.date
                          ? new Date(order.eventData.date).toLocaleDateString()
                          : t("orders_page.no_date")}
                      </p>
                      
                      {/* Event Category */}
                      {order.category && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="font-medium">
                            {t("filters.event_type")}:{" "}
                          </span>
                          {order.category}
                        </p>
                      )}

                      {/* Total + Tickets */}
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 flex flex-wrap items-center gap-3 sm:gap-4">
                        <p>
                          <span className="font-medium">
                            {t("orders_page.total_label")}
                          </span>{" "}
                          ${order.totalPrice}
                        </p>
                        <div className="flex items-center gap-1">
                          <TicketIcon className="w-4 h-4 text-primary" />
                          <span className="font-medium">
                            x{order.tickets?.length || 0}{" "}
                            {(order.tickets?.length || 0) === 1
                              ? t("orders_page.ticket_singular")
                              : t("orders_page.ticket_plural")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronDownIcon
                      strokeWidth={3}
                      className={`w-4 h-4 cursor-pointer text-gray-700 transition-transform ${
                        activeAccordion === order.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Accordion content */}
                {activeAccordion === order.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6">
                    <div className="flex flex-col gap-6">
                      {order.tickets?.map((ticket, index: number) => (
                        <div
                          key={ticket.id}
                          className="bg-white dark:bg-subtle-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row overflow-hidden"
                        >
                          <div className="p-5 flex-grow flex flex-col">
                            <div>
                              <div className="flex items-center gap-2">
                                <TicketIcon className="w-4 h-4 text-primary" />
                                <h3 className="text-xs font-semibold uppercase text-primary tracking-wider">
                                  {t("orders_page.ticket_label", { index: index + 1 })}
                                </h3>
                              </div>
                              <p className="text-2xl font-bold mt-1">
                                {order.eventData?.title || t("orders_page.event_fallback")}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 mb-2">
                                {order.eventData?.date
                                  ? new Date(
                                      order.eventData.date
                                    ).toLocaleDateString()
                                  : t("orders_page.no_date")}
                              </p>
                              <div className="text-xs text-gray-600 mt-4 space-y-1">
                                <p>
                                  <span className="font-medium">
                                    {t("orders_page.attendee_label")}
                                  </span>{" "}
                                  {order.userEmail || "—"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                              <p className="text-sm font-medium text-gray-500">
                                ${order.price?.toFixed(2) || "—"}
                              </p>
                            </div>
                          </div>

                          {/* QR Section */}
                          <div className="w-full sm:w-40 bg-gray-100 dark:bg-gray-800 border-t sm:border-t-0 sm:border-l border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center p-3">
                            <div className="w-full max-w-[120px] aspect-square bg-white p-1.5 rounded-md shadow-inner">
                              <img
                                src={
                                  ticket.qrCodeUrl ||
                                  `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.id}`
                                }
                                alt={t("orders_page.qr_alt", { id: ticket.id })}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <p className="text-sm text-gray-600 font-mono tracking-widest mt-2">
                              {ticket.ticketNumber}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
