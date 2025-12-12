"use client";


import { MdConfirmationNumber } from "react-icons/md";
import Link from "next/link";
import { useTranslation } from 'react-i18next';

const CreateEventSection = () => {
  const { t } = useTranslation('common');
  return (
    <section className="py-16 md:py-24 lg:py-32 overflow-hidden bg-subtle dark:bg-subtle-dark/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="relative bg-white dark:bg-subtle-dark rounded-xl shadow-2xl
         flex flex-col md:flex-row items-center group transition-all 
         duration-500 hover:scale-[1.02] overflow-hidden">
          
          <div className="absolute -top-12 -left-12 w-32 h-32
           bg-primary/10 dark:bg-primary/20 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-secondary/10 
          dark:bg-secondary/20 rounded-full blur-3xl"></div>

          
          <div className="w-full md:w-[40%] lg:w-2/3 relative p-8 sm:p-12 md:p-16 xl:p-20 text-center md:text-left z-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight text-primary dark:text-white">
              {t('home.create.title')}
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-lg mx-auto md:mx-0">
              {t('home.create.subtitle')}
            </p>
            <Link
              href="/organizers"
              className="inline-block  text-white font-semibold
               py-4 px-10 rounded-full transition-all duration-300 transform shadow-lg
               bg-primary hover:bg-primary-600 hover:scale-105 active:scale-95 text-lg"
            >
              {t('home.create.cta')}
            </Link>
          </div>

          
          <div className="w-full md:w-[40%] lg:w-1/3 h-80 md:h-auto md:self-stretch relative p-8 md:p-12 bg-primary text-white flex flex-col justify-center items-center text-center">
            
            <div
              className="absolute inset-y-0 left-0 w-8 bg-repeat-y hidden md:block"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 0 12px, transparent 12px, #1e3a8a 12px), radial-gradient(circle at 0 12px, white 12px, transparent 12px)",
                backgroundSize: "24px 24px",
              }}
            ></div>

            <div
              className="dark:absolute dark:inset-y-0 dark:left-0 dark:w-8 dark:bg-repeat-y hidden md:block"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 0 12px, transparent 12px, #1e3a8a 12px), radial-gradient(circle at 0 12px, #0c182a 12px, transparent 12px)",
                backgroundSize: "24px 24px",
              }}
            ></div>

            <MdConfirmationNumber className="text-6xl text-white/50 mb-4" />
            <h3 className="text-3xl font-display">{t('home.create.ticket.admit_one')}</h3>
            <p className="mt-2 text-white/80">{t('home.create.ticket.organizer')}</p>
            <div className="w-full border-t border-dashed border-white/30 my-6"></div>
            <p className="font-semibold">{t('home.create.ticket.row').toUpperCase()}</p>
            <p className="text-4xl font-bold">A</p>
            <p className="font-semibold mt-4">{t('home.create.ticket.seat').toUpperCase()}</p>
            <p className="text-4xl font-bold">1</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateEventSection;
