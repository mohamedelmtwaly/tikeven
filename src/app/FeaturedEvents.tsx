"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/features";
import { fetchEvents } from "@/lib/features/eventSlice";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import {
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiShare2,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

export default function FeaturedEvents() {
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();
  const { events } = useSelector((state: RootState) => state.events);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("common");

  const scroll = (direction: "next" | "prev") => {
    const slider = sliderRef.current;
    if (!slider) return;
    slider.scrollBy({
      left: direction === "next" ? 500 : -500,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    dispatch(fetchEvents());
    const auth = getAuth();
    return onAuthStateChanged(auth, (user) => setIsLoggedIn(!!user));
  }, [dispatch]);

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-background dark:bg-background-dark relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <h2 className="text-4xl md:text-6xl lg:text-6xl font-bold tracking-tight text-primary dark:text-white text-center md:text-left mb-6 md:mb-0">
            {t("home.featured.title")}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => scroll("prev")}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-subtle-dark text-gray-800 dark:text-gray-100 shadow-md hover:shadow-lg hover:bg-primary hover:text-white transition-all duration-300"
              aria-label={t("home.common.prev_button")}
            >
              <FiChevronLeft className="text-2xl" />
            </button>
            <button
              onClick={() => scroll("next")}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-subtle-dark text-gray-800 dark:text-gray-100 shadow-md hover:shadow-lg hover:bg-primary hover:text-white transition-all duration-300"
              aria-label={t("home.common.next_button")}
            >
              <FiChevronRight className="text-2xl" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={sliderRef}
            className="flex overflow-x-auto gap-6 lg:gap-8 pb-8 -mb-8 snap-x snap-mandatory scroll-smooth scrollbar-hide"
          >
            {events?.map((event: any, index: number) => (
              <div
                key={index}
                className="group shrink-0 snap-start w-[calc(100%-2rem)] sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.3333%-1.5rem)] xl:w-[calc(33.3333%-2rem)]"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-[550px]">
                  <img
                    src={event.images[0]}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

                  <div className="absolute top-5 right-5 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      className="w-12 h-12 
                    rounded-full bg-white/20 backdrop-blur-sm
                     text-white flex items-center justify-center
                      hover:bg-white/30 hover:scale-110 transition-all"
                    >
                      <FiHeart className="text-2xl" />
                    </button>
                    <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-all">
                      <FiShare2 className="text-2xl" />
                    </button>
                  </div>

                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <h3 className="text-3xl font-bold text-white">
                      {event.title}
                    </h3>
                    <p className="text-gray-300 mt-1">
                      {formatDate(event.startDate)}
                      {event.endDate ? "" : ""}
                    </p>
                    <div className="flex justify-between items-end mt-5">
                      <p className="text-xl font-semibold text-white">
                        {event.isFree ? "Free" : event.price + " EGP"}
                      </p>
                     {new Date(event.endDate) > new Date() && (
                       <button
                         onClick={() => {
                           if (isLoggedIn) {
                             router.push(`/events/${event.id}/order`);
                           } else {
                             router.push("/login");
                           }
                         }}
                         className="bg-primary text-white font-semibold
                           px-6 py-2 text-sm rounded-full hover:opacity-90 transition-all"
                       >
                         {isLoggedIn ? "Get Ticket" : "Login to Continue"}
                       </button>
                     )}

                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="shrink-0 mt-7 flex items-center">
            <Link
              href="/events"
              className="bg-primary
       text-white px-12 py-3 rounded-full 
       font-semibold whitespace-nowrap hover:opacity-90
        transition-all ml-auto"
            >
              {t("home.featured.show_all")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
