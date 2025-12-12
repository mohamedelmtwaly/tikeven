"use client";

import { useTranslation } from "react-i18next";
import { StarIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit, startAfter } from "firebase/firestore";
import { db } from "@/services/firebase/config";

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface EventReviewsProps {
  eventId: string;
  currentUserId?: string;
}

export default function EventReviews({ eventId, currentUserId }: EventReviewsProps) {
  const { t } = useTranslation("common");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const reviewsPerPage = 5;

  const fetchReviews = async (isInitialLoad = false) => {
    try {
      setLoading(true);
      let q;
      
      if (isInitialLoad || !lastVisible) {
        q = query(
          collection(db, "reviews"),
          where("eventId", "==", eventId),
          orderBy("createdAt", "desc"),
          limit(reviewsPerPage)
        );
      } else {
        q = query(
          collection(db, "reviews"),
          where("eventId", "==", eventId),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(reviewsPerPage)
        );
      }

      const querySnapshot = await getDocs(q);
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];

      if (isInitialLoad) {
        setReviews(reviewsData);
      } else {
        setReviews(prev => [...prev, ...reviewsData]);
      }

      setHasMore(reviewsData.length === reviewsPerPage);
      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(true);
  }, [eventId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="mt-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="mt-8 text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">
          {t("reviews.no_reviews")}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary mb-6">
        {t("reviews.title")}
      </h2>
      
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-medium">
                  {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {review.userName}
                  </h4>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-gray-700 dark:text-gray-300">
              {review.comment}
            </p>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchReviews(false)}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t("common.loading")}
              </>
            ) : (
              t("reviews.load_more")
            )}
          </button>
        </div>
      )}
    </div>
  );
}
