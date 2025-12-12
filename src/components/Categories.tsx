"use client";

import Image from "next/image";
import { useRef, useCallback, JSX } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  BuildingLibraryIcon,
  AcademicCapIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { AppDispatch, RootState } from "@/lib/features";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo } from "react";
import { fetchCategories } from "@/lib/features/categorySlice";
import { useTranslation } from 'react-i18next';
import { getAllEvents } from "@/lib/events/eventSlice";


interface Category {
  title: string;
  events: number;
  icon: JSX.Element;
  image: string;
}

interface BrowseByCategoryProps {
  onCategoryClick?: (categoryId: string) => void;
  selectedCategory?: string | null;
}

export default function BrowseByCategory({ onCategoryClick, selectedCategory }: BrowseByCategoryProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { categories, loading } = useSelector(
    (state: RootState) => state.categories
  );
  const { allEvents } = useSelector((state: RootState) => state.eventsInfo || { allEvents: [] });
  const { t, ready } = useTranslation('common');
  const router = useRouter();
  
  // Count events per category
  const eventsCountByCategory = useMemo(() => {
    const countMap: Record<string, number> = {};
    
    // Initialize all categories with 0
    categories.forEach(cat => {
      if (cat.id) countMap[cat.id] = 0;
    });
    
    // Count events for each category
    allEvents.forEach(event => {
      if (event.category && countMap[event.category] !== undefined) {
        countMap[event.category]++;
      }
    });
    
    return countMap;
  }, [categories, allEvents]);
  
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(getAllEvents() as any);
  }, [dispatch]);

  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryClick) {
      onCategoryClick(categoryId);
    } else {
      // Default behavior: navigate to events page with category filter
      router.push(`/events?category=${categoryId}`);
    }
  };

  // Don't render until translations are ready
  if (!ready) {
    return (
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="h-24 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div>
        </div>
      </section>
    );
  }

  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: "next" | "prev") => {
    const el = sliderRef.current;
    if (!el) return;
    
    const card = el.querySelector(".category-card");
    if (!card) return;
    
    const cardElement = card as HTMLElement;
    const cardWidth = cardElement.offsetWidth + 24; // 24px gap between cards
    const scrollAmount = direction === "next" ? cardWidth : -cardWidth;
    
    el.scrollBy({
      left: scrollAmount,
      behavior: "smooth"
    });
  }, []);

  return (
    <section className="py-16 md:py-24 lg:py-32 fade-in">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div className="text-center md:text-left mb-8 md:mb-0">
            <h2 className="text-4xl md:text-6xl lg:text-6xl font-bold mb-6 tracking-tight text-primary dark:text-white">
              {t('home.categories.title', 'Browse By Category')}
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              {t('home.categories.subtitle', 'Discover events that match your interests and explore new experiences')}
            </p>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-4">
            <button
              onClick={() => scroll("prev")}
              className="btn-ghost animated-button-icon w-12 h-12 rounded-full flex items-center justify-center shadow"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll("next")}
              className="btn-ghost animated-button-icon w-12 h-12 rounded-full flex items-center justify-center shadow"
            >
              <ArrowRightIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            dir="ltr"
            ref={sliderRef}
            className="slider-container flex overflow-x-auto snap-x snap-mandatory gap-6 lg:gap-8 pb-8 -mb-8 scrollbar-hide"
            style={{
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE and Edge
              WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
            }}
          >
            {categories.map((cat, idx) => (
              <div
                key={cat.id || idx}
                className=" category-card snap-start shrink-0 w-72 md:w-80 lg:w-96 group relative"
              >
                <button
                  onClick={() => cat.id && handleCategoryClick(cat.id)}
                  className={`w-full h-full text-left ${
                    selectedCategory === cat.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div dir="ltr" className="cursor-pointer relative w-full bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden flex h-44 perforated-edge">
                    <div className="w-2/3 h-full relative overflow-hidden rounded-l-2xl">
                      <Image
                        alt={`${cat.name} event`}
                        src={cat.image}
                        width={400}
                        height={200}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                          <PaintBrushIcon className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </div>
                    <div className="w-1/3 flex flex-col justify-center items-center text-center p-4 bg-white dark:bg-gray-800">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('home.categories.events_label', { 
                          count: cat.id ? eventsCountByCategory[cat.id] || 0 : 0,
                          defaultValue: cat.id ? `${eventsCountByCategory[cat.id] || 0} events` : '0 events'
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
      
      {/* 🎟️ Ticket Edge Style */}
      <style jsx>{`
        .perforated-edge::before,
        .perforated-edge::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 12px;
          z-index: 10;
        }

        /* Left holes */
        .perforated-edge::before {
          left: calc(66.66% - 6px); /* middle edge between photo & text */
          background-image: radial-gradient(
            circle at 0% 50%,
            transparent 6px,
            white 6.5px
          );
          background-size: 12px 24px;
          background-position: 0 12px;
        }

        /* Right holes mirror */
        .perforated-edge::after {
          display: none; /* we only need middle edge */
        }

        @media (prefers-color-scheme: dark) {
          .perforated-edge::before {
            background-image: radial-gradient(
              circle at 0% 50%,
              transparent 6px,
              #1f2937 6.5px
            );
          }
        }
      `}</style>
    </section>
  );
}
