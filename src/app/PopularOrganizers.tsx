"use client";

import { useEffect, useState } from "react";
import { fetchOrganizers } from "@/services/firebase/Auth/userOrganize";
import Image from "next/image";
import User from "@/types/user";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const PopularOrganizers = () => {
  const [organizers, setOrganizers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation("common");

  useEffect(() => {
    const getOrganizers = async () => {
      try {
        const data = await fetchOrganizers();
        // Get latest organizers by createdAt (newest first) and take top 8
        const sortedByLatest = [...data].sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });

        const latestEight = sortedByLatest.slice(0, 8);

        setOrganizers(latestEight);
      } catch (err) {
        console.error("Failed to load organizers:", err);
      } finally {
        setLoading(false);
      }
    };
    getOrganizers();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500 text-lg">
        {t("home.organizers.loading")}
      </div>
    );
  }

  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <h2 className="text-4xl md:text-5xl font-bold lg:text-6xl font-display tracking-tight text-center text-primary dark:text-white">
          {t("home.organizers.title")}
        </h2>

        <p className="text-center text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto mt-4 mb-16">
          {t("home.organizers.subtitle")}
        </p>

        {organizers.length === 0 ? (
          <p className="text-center text-gray-500">
            {t("home.organizers.empty")}
          </p>
        ) : (
          <Swiper
            modules={[Pagination, Autoplay]}
            slidesPerView={2}
            spaceBetween={20}
            autoplay={{ delay: 2500, disableOnInteraction: false }}
            breakpoints={{
              640: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 5 },
              1280: { slidesPerView: 6 },
            }}
            className="pb-10"
          >
            {organizers.map((org) => (
              <SwiperSlide key={org.id}>
                <Link href={`/organizer/${org.id}`}>
                  <div className="flex flex-col items-center gap-4 group">
                    <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-transparent group-hover:border-primary-600 transition-all duration-300 shadow-lg">
                      <Image
                        alt={org.name}
                        src={org.image || "/images/organizer_placeholder.png"}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>

                    <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200 text-center group-hover:text-primary transition-colors">
                      {org.name}
                    </h3>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
};

export default PopularOrganizers;
