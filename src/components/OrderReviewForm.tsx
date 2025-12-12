"use client";

import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';

interface ReviewData {
  rating: number;
  comment: string;
}

interface OrderReviewFormProps {
  orderId: string;
  eventName: string;
  onReviewSubmit: (review: ReviewData) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialRating?: number;
  initialComment?: string;
}

export default function OrderReviewForm({ 
  orderId, 
  eventName, 
  onReviewSubmit, 
  onCancel,
  isSubmitting = false,
  initialRating = 0,
  initialComment = ''
}: OrderReviewFormProps) {
  const { t } = useTranslation("common");
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0) {
      try {
        await onReviewSubmit({ rating, comment });
      } catch (error) {
        console.error('Error submitting review:', error);
      }
    }
  };

  return (
    <div className="mt-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
      <div className="mb-5">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {t('reviews.leave_review')}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('reviews.how_was_event', { event: eventName })}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1.5 focus:outline-none transform transition-transform hover:scale-110"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              >
                <StarIcon
                  className={`h-7 w-7 ${(hoveredRating || rating) >= star 
                    ? 'text-yellow-400 drop-shadow-sm' 
                    : 'text-gray-300 dark:text-gray-600'} 
                    transition-all duration-200`}
                />
              </button>
            ))}
            <span className="ml-3 text-sm font-medium text-gray-600 dark:text-gray-300">
              {rating > 0 ? (
                <span className="text-amber-600 dark:text-amber-400">{t('reviews.rating', { rating })}</span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">{t('reviews.select_rating')}</span>
              )}
            </span>
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label 
            htmlFor={`comment-${orderId}`} 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('reviews.comment')} <span className="text-gray-400">({t('common.optional')})</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <textarea
              id={`comment-${orderId}`}
              rows={4}
              className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 resize-none"
              placeholder={t('reviews.comment_placeholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              aria-describedby="comment-help"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="comment-help">
            {t('reviews.share_experience')}
          </p>
        </div>
        
        <div className="pt-2 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 transition-colors duration-200"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('common.submitting')}
              </span>
            ) : (
              <span className="flex items-center">
                <StarIcon className="w-4 h-4 mr-1.5" />
                {t('reviews.submit_review')}
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
