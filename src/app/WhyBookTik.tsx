"use client";

import Image from "next/image";
import { FiHeart, FiShare2 } from "react-icons/fi";
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function WhyBookTik() {
  const { t } = useTranslation('common');
  return (
    <section className="py-20 md:py-28 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-16">
        
        <div className="flex-1 text-center lg:text-left">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-primary dark:text-white">
            {t('home.whytik.title')}
          </h2>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto lg:mx-0">
            {t('home.whytik.lead')}
          </p>

          
          <div className="mt-10 grid grid-cols-1 items-center sm:grid-cols-2 gap-8">
            
            <div className="flex items-start gap-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-4xl text-primary">
                 <FiHeart className="text-2xl" />
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-1">
                  {t('home.whytik.items.seamless.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('home.whytik.items.seamless.desc')}
                </p>
              </div>
            </div>

           
            <div className="flex items-start gap-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-primary/10 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-4xl text-primary">
                  <FiShare2 className="text-2xl" />
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-1">
                  {t('home.whytik.items.diverse.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('home.whytik.items.diverse.desc')}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/events"
            className="inline-block mt-10 bg-primary
             text-white font-semibold py-3 px-8 rounded-full 
             transition-all duration-300 hover:scale-105 hover:bg-primary-600"
          >
            {t('home.whytik.cta')}
          </Link>
        </div>

        
        <div className="flex-1 relative w-full h-[450px] md:h-[500px] lg:h-[550px]">
          
          <div className="absolute inset-0 bg-primary/5 dark:bg-primary/20 blur-3xl rounded-full"></div>

         
          <div className="relative grid grid-cols-2 grid-rows-2 gap-6 w-full h-full">
            <div className="rounded-2xl overflow-hidden shadow-xl transform rotate-[-5deg] hover:rotate-0 hover:scale-105 transition-all duration-300">
              <Image
                src="/images/robot.jpg"
                alt="Robot"
                fill
                className="object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl transform rotate-[4deg] hover:rotate-0 hover:scale-105 transition-all duration-300">
              <Image
                src="https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=2000"
                alt="Mobile ticket purchase"
                fill
                className="object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl transform rotate-[7deg] hover:rotate-0 hover:scale-105 transition-all duration-300">
              <Image
                src="https://images.unsplash.com/photo-1564399580075-5dfe19c205f3?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Art event"
                fill
                className="object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl transform rotate-[-3deg] hover:rotate-0 hover:scale-105 transition-all duration-300">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzk93oMfFWNpo--SYNTH16UPN2Tu3aBQZvWq2l7ax9Yx0ebybQY8iqqdCZvRX3lP_p8u-ZF0aNTZkHgGgsafnQl2zyg4oDlswhehkwqTojH1y7G4t4ZL6DefwoFOrxRtpliPAJCse_jC3zXrwqBy_c4ledrOea_ptNpnYskU3z6J761vjo3_BDXYm6XGk2K1UPPxZvP_474nTVmqAQ0a8uFTpu5LO97z9KS5FmhOLEV_niKD9IxS2DQoyFWiBG3OKac9BRzMN-33pl"
                alt="Music festival crowd"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
