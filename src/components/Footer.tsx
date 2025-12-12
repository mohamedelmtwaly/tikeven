"use client";

import Image from "next/image";
import {
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import {
  Twitter,
  Instagram,
  Linkedin,
  Facebook,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation("common");

  return (
    <footer className="bg-gradient-to-br from-gray-50 via-white to-gray-100 border-t border-gray-200">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Logo + Text */}
          <div>
            <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-200 bg-white shadow-md flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="TikEven Logo"
                width={60}
                height={60}
                className="object-cover"
              />
            </div>

            <p className="text-gray-600 leading-relaxed font-semibold mt-8 text-[15px]">
              {t("footer.description")}
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-primary-800 font-bold text-lg mb-5 relative after:absolute after:-bottom-1 after:left-0 after:w-10 after:h-[2px] after:bg-primary">
              {t("footer.explore.title")}
            </h3>

            <ul className="space-y-3 text-[15px]">
              {["categories", "featured", "venues", "organizers"].map((key) => (
                <li key={key}>
                  <a href="#" className="text-primary-600 font-semibold hover:text-primary transition-colors">
                    {t(`footer.explore.${key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-primary-800 font-bold text-lg mb-5 relative after:absolute after:-bottom-1 after:left-0 after:w-10 after:h-[2px] after:bg-primary">
              {t("footer.company.title")}
            </h3>

            <ul className="space-y-3 text-[15px]">
              {["about", "careers", "privacy", "terms"].map((key) => (
                <li key={key}>
                  <a href="#" className="text-primary-600 font-semibold hover:text-primary transition-colors">
                    {t(`footer.company.${key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gray-800 font-bold text-lg mb-5 relative after:absolute after:-bottom-1 after:left-0 after:w-10 after:h-[2px] after:bg-primary">
              {t("footer.contact.title")}
            </h3>

            <ul className="space-y-4 text-gray-600 text-[15px]">
              <li className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                {t("footer.contact.address")}
              </li>
              <li className="flex items-start gap-3">
                <EnvelopeIcon className="w-5 h-5 text-primary-600 flex-shrink-0 cursor-pointer" />
                {t("footer.contact.email")}
              </li>
              <li className="flex items-start gap-3">
                <PhoneIcon className="w-5 h-5 text-primary-600 flex-shrink-0 cursor-pointer" />
                {t("footer.contact.phone")}
              </li>
            </ul>
          </div>
        </div>

        {/* Social Icons */}
        <div className="mt-14 flex justify-center items-center gap-12">
          {[Twitter, Instagram, Linkedin, Facebook].map((Icon, i) => (
            <a
              key={i}
              href="#"
              className="p-3 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-primary-600 hover:text-white transition-all duration-300 transform hover:scale-110"
            >
              <Icon className="w-6 h-6" />
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-gray-200 pt-6 text-center">
          <p className="text-gray-500 text-lg ">
            © {new Date().getFullYear()}{" "}
            <span className="font-bold text-primary-700">TikEven</span>.
            {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
