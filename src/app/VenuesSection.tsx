
"use client";

import Image from "next/image";
import { useRef, useCallback, useEffect } from "react";
import { ArrowLeftIcon, ArrowRightIcon, MapPinIcon, UsersIcon } from "@heroicons/react/24/outline";
import { AppDispatch, RootState } from "@/lib/features";
import { useDispatch, useSelector } from "react-redux";
import { fetchVenues } from "@/lib/features/venueSlice";
import Link from "next/link";
import { useTranslation } from 'react-i18next';

export default function VenuesSection() {
  const dispatch = useDispatch<AppDispatch>();
  const { venues, loading } = useSelector((state: RootState) => state.venues);
  const { t } = useTranslation('common');

  useEffect(() => {
    dispatch(fetchVenues());
  }, [dispatch]);

  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: "next" | "prev") => {
    const el = sliderRef.current;
    if (!el) return;
    const card = el.querySelector("a");
    if (!card) return;
    const cardWidth = (card as HTMLElement).offsetWidth + 24;

    el.scrollBy({
      left: cardWidth * (direction === "next" ? 1 : -1),
      behavior: "smooth",
    });
  }, []);

  return (
    <section className="py-16 md:py-24 lg:py-32 fade-in">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        
      
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div className="text-center md:text-left mb-8 md:mb-0">
            <h2 className="text-4xl md:text-6xl lg:text-6xl font-bold mb-6 tracking-tight text-primary dark:text-white">
              {t('home.venues.title')}
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              {t('home.venues.subtitle_line1')}
              <br />
              {t('home.venues.subtitle_line2')}
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

        
        {(loading || venues.length === 0) && (
          <div className="flex justify-center py-10">
            <p className="text-gray-500 dark:text-gray-300 text-lg">
              {loading ? t('home.venues.loading') : t('home.venues.empty')}
            </p>
          </div>
        )}

       
        <div className="relative">
          <div
            dir="ltr"
            ref={sliderRef}
            className="slider-container flex overflow-x-hidden snap-x snap-mandatory gap-6 lg:gap-8 pb-8 -mb-8"
          >
            {venues.map((venue) => (
              <Link
                href={`/venues/${venue.id}`}
                key={venue.id}
                className="snap-start shrink-0 w-72 md:w-80 lg:w-96 group relative"
              >
                <div dir="ltr" className="relative w-full bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden flex h-44 perforated-edge">

                  <div className="w-2/3 h-full relative overflow-hidden rounded-l-2xl">
                    <Image
                      alt={venue.title}
                      src={venue.images?.[0] || "/default.jpg"}
                      width={500}
                      height={300}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                   
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                        <MapPinIcon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>

                
                  <div className="w-1/3 flex flex-col justify-center items-center text-center p-4 bg-white dark:bg-gray-800">
                    <h3 className="text-md font-bold text-gray-900 dark:text-white">
                      {venue.title}
                    </h3>
                    <p className="text-sm font-bold mt-6 text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <UsersIcon className="w-4 h-4" />
                      {venue.capacity}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

            <div className="shrink-0 mt-7 flex items-center">
  <Link
    href="/venues"
    className="bg-primary text-white px-12 py-3 rounded-full 
               font-semibold whitespace-nowrap hover:opacity-90
               transition-all ml-auto"
  >
    {t('home.venues.show_all')}
  </Link>
</div>

      </div>

  
      <style jsx>{`
        .perforated-edge::before {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: calc(66.66% - 6px);
          width: 12px;
          background-image: radial-gradient(
            circle at 0% 50%,
            transparent 6px,
            white 6.5px
          );
          background-size: 12px 24px;
          background-position: 0 12px;
          z-index: 10;
        }

        @media (prefers-color-scheme: dark) {
          .perforated-edge::before {
            background-image: radial-gradient(
              circle at 0% 50%,
              transparent 6px,
              #ffffff 6.5px
            );
          }
        }
      `}</style>
    </section>
  );
}
