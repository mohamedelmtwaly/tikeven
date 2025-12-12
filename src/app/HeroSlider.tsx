"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/features";
import { fetchEvents } from "@/lib/features/eventSlice";
import { selectIsAuthenticated } from "@/lib/features/userSlice";
import { useTranslation } from 'react-i18next';
import { Event } from "@/types/event";

export default function HeroSlider() {
  const dispatch = useDispatch<AppDispatch>();
  const { events, loading } = useSelector((state: RootState) => state.events);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { t } = useTranslation('common');
  const router = useRouter();

  const [active, setActive] = useState(0);
  const duration = 5000;

  // Calculate upcoming events
  const upcomingEvents = events
    .filter(event => {
      if (!event.startDate) return false;
      const eventDate = new Date(event.startDate);
      const now = new Date();
      return eventDate >= now; // Only include events that haven't started yet
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) // Sort by start date
    .slice(0, 6); // Limit to 6 events
  
  // Fetch events on mount
  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  // Track if we've entered a loading state at least once
  const seenLoadingRef = useRef(false);
  useEffect(() => {
    if (loading) seenLoadingRef.current = true;
  }, [loading]);

  // Auto-rotation effect
  useEffect(() => {
    if (upcomingEvents.length <= 1) return; // Don't auto-rotate if 1 or 0 events
    setActive(0);
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % upcomingEvents.length);
    }, duration);

    return () => clearInterval(timer);
  }, [upcomingEvents.length, duration]);

  const nextSlide = () => {
    if (!events.length) return;
    setActive((prev) => (prev + 1) % Math.min(events.length, 6));
  };

  const prevSlide = () => {
    if (!events.length) return;
    setActive((prev) => (prev - 1 + Math.min(events.length, 6)) % Math.min(events.length, 6));
  };


  const showLoading = loading || !seenLoadingRef.current;
  if (showLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="relative w-48 h-48 md:w-64 md:h-64">
          <Image
            src="/logo.png"
            alt="App Logo"
            fill
            className="object-contain p-6 object-contain animate-pulse"
            priority
          />
        </div>
        <div className="mt-4 w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary-600 animate-[progress_2s_ease-in-out_infinite]" />
        </div>
      </div>
    );
  }
  if (!events.length) {
    return (
      <section className="relative w-full h-screen overflow-hidden">
        <Image
          src="/images/placeholder.jpg"
          alt={t('home.hero.no_events_yet', 'No events available yet')}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p className="text-2xl">{t('home.hero.no_events_available', 'No events available at the moment')}</p>
        </div>
      </section>
    );
  }
  
  return (
    <section className="relative w-full h-screen overflow-hidden">
      {upcomingEvents.map((event: Event, index: number) => (
        <div
          key={event.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === active ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={
              event.images && event.images.length > 0
                ? event.images[0]
                : "/images/placeholder.jpg"
            }
            alt={event.title}
            fill
            className="object-cover"
            priority={index === 0}
            unoptimized
          />

          
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />

         
          <div className="absolute inset-0 flex flex-col justify-end text-white p-8 md:p-20">
            <div className="max-w-4xl space-y-6 animate-fadeIn">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                {event.title}
              </h1>
              <p className="text-lg md:text-xl opacity-90">
                {event.description || t('home.hero.no_description', 'No description available')}
              </p>

              <div className="flex flex-wrap gap-4 pt-4 mb-18 md:mb-8">
                {isAuthenticated ? (
                  <button
                    className="bg-primary text-white px-10 py-3 rounded-full font-semibold hover:bg-primary/90 transition cursor-pointer"
                    onClick={() => router.push(`/events/${event.id}/order`)}
                  >
                    {t('home.hero.get_tickets', 'Get Tickets')}
                  </button>
                ) : (
                  <button
                    className="bg-primary text-white px-10 py-3 rounded-full font-semibold hover:bg-primary/90 transition cursor-pointer"
                    onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/events/${event.id}/order`)}`)}
                  >
                    {t('home.hero.login_to_get_tickets', 'Login to Get Tickets')}
                  </button>
                )}
                <button
                  className="bg-white/20 text-white px-10 py-3 rounded-full font-semibold hover:bg-white/30 transition cursor-pointer"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  {t('home.hero.learn_more', 'Learn More')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-0 w-full flex justify-between items-center p-6 bg-linear-to-t from-black/30 via-black/20 to-transparent backdrop-blur-xs transition-all duration-500 hover:backdrop-blur-l hover:bg-black/30 z-20">

        <button
          onClick={prevSlide}
          className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:scale-110 hover:bg-white/40 transition-all duration-300 shadow-lg"
        >
          <FiChevronLeft size={26} />
        </button>

        <div className="w-2/4 bg-white/20 h-1 rounded-full overflow-hidden mx-6 shadow-inner">
          <div
            key={active}
            className="bg-primary h-1 animate-[progress_5s_linear_forwards]"
          ></div>
        </div>

        <button
          onClick={nextSlide}
          className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:scale-110 hover:bg-white/40 transition-all duration-300 shadow-lg"
        >
          <FiChevronRight size={26} />
        </button>

      </div>
    </section>
  );
}
