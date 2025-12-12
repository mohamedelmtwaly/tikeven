/** @format */

"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import type { AppDispatch, RootState } from "@/lib/features";
import { fetchEventById, updateEventStatus } from "@/lib/features/eventSlice";
import { EventStatus } from "@/types/event";
import { fetchCategories } from "@/lib/features/categorySlice";
import { fetchVenues } from "@/lib/features/venueSlice";
import { fetchReports, type Report } from "@/lib/features/reportsSlice";
import Link from "next/link";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { Calendar, ShieldAlert, MapPin, Tag, Loader2, Star, User } from "lucide-react";
import Pagination from "@/components/Pagination";
import Swal from "sweetalert2";
import Spinner from "@/components/Spinner";

const statusColors: Record<string, string> = {
  banned: "bg-red-100 text-red-600",
  published: "bg-blue-100 text-blue-600",
  "under review": "bg-yellow-100 text-yellow-600",
};

export default function AdminEventReportsPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string | undefined);

  const dispatch = useDispatch<AppDispatch>();
  const { currentEvent, loading: eventLoading } = useSelector(
    (state: RootState) => state.events
  );
  const { items: reports } = useSelector((state: RootState) => state.reports);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { venues } = useSelector((state: RootState) => state.venues);

  const [reporterDetails, setReporterDetails] = useState<
    Record<string, { name?: string; email?: string; image?: string | null }>
  >({});

  const [organizerDetails, setOrganizerDetails] = useState<{
    name?: string;
    email?: string;
    image?: string | null;
  } | null>(null);

  const [currentReportPage, setCurrentReportPage] = useState(1);
  const [eventStatus, setEventStatus] = useState<EventStatus>(
    currentEvent?.status || EventStatus.PUBLISHED
  );
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    checkedIn: 0,
    totalCapacity: 0,
  });

  const [reviews, setReviews] = useState<Array<{
    id: string;
    rating: number;
    comment: string;
    userName: string;
    userAvatar?: string;
    createdAt: string;
  }>>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingCounts: [0, 0, 0, 0, 0], // 1-5 stars
  });
  const reportsPerPage = 10;

  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventById(eventId));
      dispatch(fetchReports({ eventId }));
      dispatch(fetchCategories());
      dispatch(fetchVenues());
      fetchEventReviews();
    }
  }, [eventId, dispatch]);

  const fetchEventReviews = async () => {
    if (!eventId) {
      console.log('No eventId provided');
      return;
    }
    
    try {
      setReviewsLoading(true);
      console.log('Fetching reviews for event:', eventId);
      
      const reviewsRef = collection(db, 'reviews');
      const q = query(
        reviewsRef,
        where('eventId', '==', eventId),
        orderBy('createdAt', 'desc')
      );
      
      console.log('Firestore query created, executing...');
      const querySnapshot = await getDocs(q);
      
      console.log('Query results:', querySnapshot.size, 'reviews found');
      
      if (querySnapshot.empty) {
        console.log('No reviews found for this event');
        setReviews([]);
        setReviewStats({
          averageRating: 0,
          totalReviews: 0,
          ratingCounts: [0, 0, 0, 0, 0],
        });
        return;
      }
      
      const reviewsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Review data:', data);
        return {
          id: doc.id,
          rating: data.rating || 0,
          comment: data.comment || '',
          userName: data.userName || 'Anonymous',
          userAvatar: data.userAvatar || null,
          createdAt: data.createdAt || new Date().toISOString(),
        };
      });
      
      console.log('Processed reviews data:', reviewsData);
      setReviews(reviewsData);
      
      // Calculate review statistics
      if (reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviewsData.length;
        const ratingCounts = [0, 0, 0, 0, 0]; // 1-5 stars
        
        reviewsData.forEach(review => {
          if (review.rating >= 1 && review.rating <= 5) {
            ratingCounts[5 - review.rating]++;
          }
        });
        
        setReviewStats({
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalReviews: reviewsData.length,
          ratingCounts,
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentEvent) return;
    
    const fetchTicketStats = async () => {
      try {
        const ticketsQuery = query(
          collection(db, "tickets"),
          where("eventId", "==", eventId)
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const totalTickets = ticketsSnapshot.size;
        
        const checkedInQuery = query(
          collection(db, "tickets"),
          where("eventId", "==", eventId),
          where("checkedIn", "==", true)
        );
        const checkedInSnapshot = await getDocs(checkedInQuery);
        const checkedInTickets = checkedInSnapshot.size;
        
        setTicketStats({
          total: totalTickets,
          checkedIn: checkedInTickets,
          totalCapacity: currentEvent.ticketsCount || 0,
        });
      } catch (error) {
        console.error("Error fetching ticket stats:", error);
      }
    };
    
    fetchTicketStats();
  }, [currentEvent, eventId]);

  const eventReports: Report[] = reports.filter((r) => r.eventId === eventId);

  useEffect(() => {
    if (eventReports.length === 0) return;

    const loadReporters = async () => {
      const missingIds = Array.from(
        new Set(
          eventReports
            .map((r) => r.reporterId)
            .filter((id): id is string => !!id && !reporterDetails[id])
        )
      );

      if (missingIds.length === 0) return;

      try {
        const updates: Record<
          string,
          { name?: string; email?: string; image?: string | null }
        > = {};

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
  }, [eventReports, reporterDetails]);

  useEffect(() => {
    const organizerId = currentEvent?.organizerId as string | undefined;
    if (!organizerId) return;

    const loadOrganizer = async () => {
      try {
        const snap = await getDoc(doc(db, "users", organizerId));
        if (!snap.exists()) {
          setOrganizerDetails(null);
          return;
        }
        const data = snap.data() as any;
        setOrganizerDetails({
          name: data.name,
          email: data.email,
          image: data.image ?? null,
        });
      } catch (e) {
        console.error("Failed to load organizer user", organizerId, e);
      }
    };

    loadOrganizer();
  }, [currentEvent?.organizerId]);

  if (!eventId) {
    return <div className="p-6 text-red-600">Invalid event id.</div>;
  }

  if (eventLoading && !currentEvent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner/>
      </div>
    );
  }

  if (!currentEvent) {
    return <div className="p-6">Event not found.</div>;
  }

  const getEventStatus = (startDate: string, endDate: string) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
      return {
        status: 'Upcoming',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
      };
    } else if (now >= start && now <= end) {
      return {
        status: 'Active',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border border-green-300 dark:border-green-700'
      };
    } else {
      return {
        status: 'Completed',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
      };
    }
  };

  return (
    <div className="relative flex min-h-screen w-full font-display bg-background-light dark:bg-background-dark">
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link
              href="/admin"
              className="text-slate-600 dark:text-slate-400 hover:text-primary"
            >
              Dashboard
            </Link>
            <span className="text-slate-400">/</span>
            <Link
              href="/admin/events"
              className="text-slate-600 dark:text-slate-400 hover:text-primary"
            >
             Events
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-primary-700 dark:text-slate-100 font-medium">
              {currentEvent.title}
            </span>
          </div>

          {/* Event Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 mb-6">
            {/* Event image */}
            {currentEvent.images && currentEvent.images.length > 0 && (
              <div className="rounded-lg overflow-hidden mb-6">
                <img
                  src={currentEvent.images[0]}
                  alt={currentEvent.title}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            {/* Header with Title and Status */}
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white break-words">
                    {currentEvent.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentEvent && (
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                        getEventStatus(currentEvent.startDate, currentEvent.endDate).color
                      }`}>
                        {getEventStatus(currentEvent.startDate, currentEvent.endDate).status}
                      </span>
                    )}
                    {currentEvent && (
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                        statusColors[currentEvent?.status?.toLowerCase() ?? "published"] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {currentEvent?.status || "Published"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                    <Calendar size={16} />
                    <span>
                      {new Date(currentEvent.startDate).toLocaleDateString()}
                      {currentEvent.endDate &&
                        ` - ${new Date(
                          currentEvent.endDate
                        ).toLocaleDateString()}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                    <Tag size={16} />
                    <span>{ticketStats.total} sold</span>
                  </div>
                </div>
              </div>

              {/* Status Section - Right aligned */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 md:mt-0">
                <select
                  value={eventStatus}
                  onChange={(e) => setEventStatus(e.target.value as EventStatus)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                    statusColors[eventStatus.toLowerCase()] || "bg-gray-100 text-gray-600"
                  } dark:bg-slate-800 dark:text-slate-100`}
                >
                  <option value={EventStatus.PUBLISHED}>Published</option>
                  <option value={EventStatus.BANNED}>Banned</option>
                </select>
                <button
                  onClick={async () => {
                    try {
                      // Check if trying to ban an event that starts in less than 2 days
                      if (eventStatus === EventStatus.BANNED) {
                        const now = new Date();
                        const startDate = new Date(currentEvent.startDate);
                        const timeDiff = startDate.getTime() - now.getTime();
                        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
                        
                        if (daysDiff <= 2) {
                          Swal.fire({
                            title: "Cannot Ban Event",
                            text: "You can only ban events that start more than 2 days from now.",
                            icon: "warning",
                            confirmButtonColor: "#3b82f6"
                          });
                          return;
                        }
                      }
                      
                      await dispatch(
                        updateEventStatus({
                          id: currentEvent.id || eventId,
                          status: eventStatus,
                        })
                      ).unwrap();
                      Swal.fire("Success", "Event status updated", "success");
                    } catch (err) {
                      Swal.fire("Error", "Failed to update status", "error");
                    }
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-slate-200 dark:border-slate-700 pt-6">
              {/* Description */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                  Description
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {currentEvent.description || "No description provided"}
                </p>
              </div>

              {/* Organizer */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                  Organized by
                </p>
                <div className="flex items-center space-x-2">
                  {organizerDetails?.image && (
                    <img
                      src={organizerDetails.image}
                      alt={organizerDetails.name || "Organizer"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    {organizerDetails?.name || currentEvent.organizerName || "Unknown"}
                  </p>
                </div>
              </div>

              {/* Venue */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Venue
                  </p>
                </div>
                {currentEvent.venueData ? (
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {currentEvent.venueData.name}
                    </p>
                    {currentEvent.venueData.address && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {currentEvent.venueData.address}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No venue specified</p>
                )}
              </div>

              {/* Ticket Stats */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">
                  Ticket Statistics
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-300">Total Capacity</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {ticketStats.totalCapacity}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: ticketStats.totalCapacity > 0 ? `${(ticketStats.total / ticketStats.totalCapacity) * 100}%` : '0%' }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>{ticketStats.total} sold</span>
                      <span>{ticketStats.totalCapacity - ticketStats.total} available</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-300">Checked In</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {ticketStats.checkedIn}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ 
                          width: ticketStats.total > 0 
                            ? `${(ticketStats.checkedIn / ticketStats.total) * 100}%` 
                            : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="h-4 w-4 text-slate-500" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Category
                  </p>
                </div>
                {currentEvent.category ? (
                  <div className="flex flex-wrap gap-2">
                    {categories.find((cat) => cat.id === currentEvent.category) ? (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                        {categories.find((cat) => cat.id === currentEvent.category)?.name}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 rounded-full">
                        {currentEvent.category}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No category</p>
                )}
              </div>
            </div>
          </div>

          {/* Reports Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Reports{" "}
                <span className="text-slate-500">({eventReports.length})</span>
              </h2>
            </div>

            {eventReports.length === 0 ? (
              <div className="text-center py-12">
                <ShieldAlert
                  size={48}
                  className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
                />
                <p className="text-slate-600 dark:text-slate-400">
                  No reports for this event
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {eventReports
                    .slice(
                      (currentReportPage - 1) * reportsPerPage,
                      currentReportPage * reportsPerPage
                    )
                    .map((report) => {
                      const reporter = reporterDetails[report.reporterId || ""];
                      const reporterImage =
                        reporter?.image ||
                        "https://api.dicebear.com/7.x/pixel-art/svg?seed=default";
                      return (
                        <div
                          key={report.id}
                          className="py-4 flex items-start justify-between gap-4"
                        >
                          {/* Reporter Avatar and Info */}
                          <div className="flex items-start gap-3 flex-1">
                            <img
                              src={reporterImage}
                              alt={reporter?.name || "Reporter"}
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                            <div className="grow">
                              <p className="font-medium text-slate-900 dark:text-white text-sm">
                                {reporter?.name || "Anonymous"}
                              </p>
                              {reporter?.email && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  {reporter.email}
                                </p>
                              )}
                              <p className="text-sm text-slate-700 dark:text-slate-200 mb-2">
                                {report.message}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-semibold text-slate-600 dark:text-slate-300">
                                  {report.type}
                                </span>
                                {report.createdAt && (
                                  <span>
                                    {new Date(
                                      report.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Pagination */}
                {eventReports.length > reportsPerPage && (
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Showing {(currentReportPage - 1) * reportsPerPage + 1} to{" "}
                      {Math.min(
                        currentReportPage * reportsPerPage,
                        eventReports.length
                      )}{" "}
                      of {eventReports.length} reports
                    </p>
                    <Pagination
                      rowsPerPage={reportsPerPage}
                      rowCount={eventReports.length}
                      currentPage={currentReportPage}
                      onChangePage={setCurrentReportPage}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Reviews <span className="text-slate-500">({reviewStats.totalReviews})</span>
              </h2>
              {reviewStats.totalReviews > 0 && (
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white mr-2">
                    {reviewStats.averageRating.toFixed(1)}
                  </span>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.round(reviewStats.averageRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : reviewStats.totalReviews === 0 ? (
              <div className="text-center py-12">
                <Star size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Rating Distribution */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Rating Distribution
                  </h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating, index) => (
                      <div key={rating} className="flex items-center">
                        <div className="w-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                          {rating}
                          <Star className="inline-block h-3 w-3 ml-1 text-yellow-400 fill-current" />
                        </div>
                        <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-2">
                          <div
                            className="h-2.5 bg-yellow-400 rounded-full"
                            style={{
                              width: `${
                                reviewStats.totalReviews > 0
                                  ? (reviewStats.ratingCounts[index] / reviewStats.totalReviews) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-8 text-right">
                          {reviewStats.ratingCounts[index]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-slate-200 dark:border-slate-700 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {review.userAvatar ? (
                            <img
                              src={review.userAvatar}
                              alt={review.userName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              {review.userName || 'Anonymous'}
                            </h4>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-slate-300 dark:text-slate-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-slate-700 dark:text-slate-300">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
