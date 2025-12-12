"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bars3Icon,
  XMarkIcon,
  TicketIcon,
  ArrowLeftEndOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserFromFirebase } from "@/lib/features/userSlice";
import { AppDispatch, RootState } from "@/lib/features";
import { logout as logoutAction } from "@/lib/features/userSlice";
import { logoutUser } from "@/services/firebase/Auth/users";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/client";
import NavNotifications from "./NavNotifications";

export default function Nav({
  transparent = false,
  wide = false,
}: {
  transparent?: boolean;
  wide?: boolean;
}) {
  const { t } = useTranslation("common");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [lang, setLang] = useState((i18n.language || "en").split("-")[0]);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { currentUser: user } = useSelector((state: RootState) => state.users);

  const isOrganizer = user?.role === "organizer";

  useEffect(() => {
    dispatch(fetchUserFromFirebase());
  }, [dispatch]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!profileRef.current || !target) return;
      if (!profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const changeLanguage = (nextLang: "en" | "ar") => {
    const normalized = nextLang;
    setLang(normalized);
    try {
      if (i18n.language !== normalized) i18n.changeLanguage(normalized);
      document.cookie = `lang=${normalized}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    } catch {}
  };

  // After mount, restore language from cookie (if present)
  useEffect(() => {
    try {
      if (typeof document === "undefined") return;
      const cookie = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("lang="));
      if (cookie) {
        const value = cookie.split("=")[1];
        const normalized = (value || "en").split("-")[0] as "en" | "ar";
        if (normalized !== lang) {
          setLang(normalized);
          if (i18n.language !== normalized) i18n.changeLanguage(normalized);
        }
      }
    } catch (err) {
      console.error("Language cookie error:", err);
    }
  }, [lang]);

  // Update document direction based on language
  useEffect(() => {
    try {
      if (typeof document === "undefined") return;
      const dir = lang === "ar" ? "rtl" : "ltr";
      document.documentElement.dir = dir;
    } catch {}
  }, [lang]);

  const navLinks = [{ name: t("nav.about"), href: "/about" }];
  const filteredLinks = isOrganizer
    ? navLinks
    : [
        { name: t("nav.events"), href: "/events" },
        { name: t("nav.venues"), href: "/venues" },
        ...navLinks,
      ];
  const linksToRender = hydrated ? filteredLinks : navLinks;

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    try {
      document.cookie = "role=; path=/; max-age=0; samesite=lax";
      document.cookie = "user=; path=/; max-age=0; samesite=lax";
    } catch {}
    try {
      localStorage.removeItem("user");
    } catch {}
    dispatch(logoutAction());
    try {
      if (pathname?.startsWith("/organizers")) {
        router.push("/login");
      } else if (pathname?.startsWith("/admin")) {
        router.push("/admin/login");
      } else {
        router.refresh();
      }
    } catch {}
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        transparent
          ? scrolled
            ? "bg-white/90 backdrop-blur-md shadow-md"
            : "bg-transparent"
          : scrolled
          ? "bg-white/90 backdrop-blur-md shadow-md"
          : "bg-background"
      }`}
    >
      <div className={`w-full mx-0 px-1 ${wide ? "md:px-6 lg:px-12" : ""}`}>
        <div className="flex items-center gap-12 justify-between h-16">
          {/* Logo */}

          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Logo"
                width={wide ? 80 : 70}
                height={wide ? 80 : 70}
                className="object-contain transition-transform duration-200 transform hover:scale-110"
              />
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-2">
              {linksToRender.map(({ name, href }) => {
                const isActive =
                  pathname === href ||
                  (href !== "/" && pathname.startsWith(href));

                return (
                  <Link
                    key={name}
                    href={href}
                    className={`relative px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group ${
                      isActive
                        ? "text-primary font-semibold"
                        : scrolled || !transparent
                        ? "text-gray-700 hover:text-primary"
                        : "text-white hover:text-primary-100"
                    }`}
                  >
                    <span suppressHydrationWarning>{name}</span>
                    <span
                      className={`absolute left-0 bottom-0 h-[2px] bg-primary transition-all duration-300 ${
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    ></span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 justify-end">
            {/* Toggle Attending/Organizer */}

            {!hydrated && (
              <div className="hidden md:flex items-center gap-2 mx-2 opacity-50">
                <span className="h-3 w-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="relative inline-flex lg:h-6 lg:w-12 md:h-5 md:w-10 rounded-full bg-gray-200 animate-pulse" />
                <span className="h-3 w-16 rounded-full bg-gray-200 animate-pulse" />
              </div>
            )}

            {hydrated && user && isOrganizer && (
              <div className="hidden md:flex items-center gap-2 mx-2 opacity-50">
                <div
                  className={`relative inline-flex lg:h-6 lg:w-12 md:h-5 md:w-10 items-center rounded-full px-1 transition-colors duration-300 
      ${isOrganizer ? "bg-primary justify-end" : "bg-gray-300 justify-start"}`}
                >
                  <span className="inline-block lg:h-5 lg:w-5 md:h-4 md:w-4 rounded-full bg-white shadow transition-transform duration-300" />
                </div>

                <span
                  className={`lg:text-sm lg:font-medium md:text-xs md:font-normal ${
                    scrolled || !transparent ? "text-gray-600" : "text-white"
                  }`}
                >
                  {t("nav.organizer")}
                </span>
              </div>
            )}

            {/* Skeleton while loading user state */}
            {!hydrated && (
              <div className="hidden md:flex items-center gap-3 mr-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
                <div className="w-16 h-8 rounded-full bg-gray-200 animate-pulse" />
              </div>
            )}

            {/* Ticket Icon */}
            {hydrated && user && !isOrganizer && (
              <div className="relative group flex items-center">
                <Link
                  href="/orders"
                  className={`p-2 rounded-full transition-transform duration-200 transform group-hover:scale-110 ${
                    scrolled || !transparent
                      ? "text-primary hover:bg-primary-50"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <TicketIcon className="w-7 h-7" />
                </Link>
                <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 scale-0 opacity-0 group-hover:opacity-100 group-hover:scale-100 bg-primary-600 text-white text-xs font-medium py-1 px-3 rounded-md shadow-md whitespace-nowrap transition-all duration-200">
                  {t("nav.tickets")}
                </span>
              </div>
            )}

            {hydrated && user && (
              <NavNotifications
                userId={user.id}
                lang={lang === "ar" ? "ar" : "en"}
                scrolled={scrolled}
                transparent={transparent}
              />
            )}

            {/* Log In / Out */}
            {hydrated && !user && (
              <div className="relative group flex items-center">
                <Link
                  href="/login"
                  className={`p-2 rounded-full mr-3 transition-transform duration-200 transform group-hover:scale-110 ${
                    scrolled || !transparent
                      ? "text-primary hover:bg-primary-50"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <ArrowLeftEndOnRectangleIcon className="w-7 h-7" />
                </Link>
                <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 scale-0 opacity-0 group-hover:opacity-100 group-hover:scale-100 bg-primary-600 text-white text-xs font-medium py-1 px-3 rounded-md shadow-md whitespace-nowrap transition-all duration-200">
                  {t("nav.login")}
                </span>
              </div>
            )}

            {/* Single Logout */}
            {hydrated && user && (
              <div className="relative group flex items-center">
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-full transition-transform duration-200 transform group-hover:scale-110 ${
                    scrolled || !transparent
                      ? "text-primary hover:bg-primary-50"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <ArrowRightEndOnRectangleIcon className="w-7 h-7" />
                </button>
                <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 scale-0 opacity-0 group-hover:opacity-100 group-hover:scale-100 bg-primary-600 text-white text-xs font-medium py-1 px-3 rounded-md shadow-md whitespace-nowrap transition-all duration-200">
                  {t("nav.logout")}
                </span>
              </div>
            )}

            {/* User Avatar + Dropdown (Desktop) */}
            {hydrated && user && (
              <div ref={profileRef} className="hidden md:block relative mr-5">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className={`flex items-center gap-1 cursor-pointer p-2 rounded-full  ${
                    transparent ? "hover:bg-white/10" : "hover:bg-primary-50"
                  } transition-colors duration-200`}
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-primary/20 shadow-sm flex-shrink-0">
                    <Image
                      key={user?.image || "placeholder"}
                      src={
                        user?.image && user.image.trim() !== ""
                          ? user.image
                          : "/images/placeholder.jpg"
                      }
                      alt={user?.name ?? "User"}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                </button>

                {/* Dropdown */}
                <div
                  className={`absolute mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 transition-all duration-150 z-50 ${
                    lang === "ar"
                      ? "left-0 origin-top-left"
                      : "right-0 origin-top-right"
                  } ${
                    profileOpen
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="px-4 pb-2 border-b border-gray-100 mb-1">
                    <p className="text-xs text-gray-400">
                      {t("nav.signedInAs")}
                    </p>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {user.name ?? "User"}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary"
                  >
                    {t("nav.viewProfile")}
                  </Link>
                  <button
                    onClick={() => changeLanguage("en")}
                    className={`flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-primary-50 ${
                      lang === "en" ? "text-primary" : "text-gray-700"
                    }`}
                  >
                    <span>English</span>
                    <span className="text-xs">EN</span>
                  </button>
                  <button
                    onClick={() => changeLanguage("ar")}
                    className={`flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-primary-50 ${
                      lang === "ar" ? "text-primary" : "text-gray-700"
                    }`}
                  >
                    <span>العربية</span>
                    <span className="text-xs">ع</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className={`md:hidden cursor-pointer p-2 rounded-full transition-colors duration-200 ${
                scrolled || !transparent ? "text-primary" : "text-white"
              }`}
              onClick={() => setMenuOpen((s) => !s)}
            >
              {menuOpen ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <Bars3Icon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`lg:hidden transition-max-height duration-300 overflow-hidden ${
          menuOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="px-4 pt-2 pb-4 border-t border-gray-100 bg-white/95 backdrop-blur-md">
          <div className="flex flex-col gap-3">
            {linksToRender.map(({ name, href }) => {
              const isActive =
                pathname === href ||
                (href !== "/" && pathname.startsWith(href));

              return (
                <Link
                  key={name}
                  href={href}
                  className={`block text-normal font-medium py-2 px-2 rounded transition-colors duration-150 ${
                    isActive
                      ? "bg-primary-50 text-white"
                      : "hover:bg-primary-50 hover:text-primary"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span suppressHydrationWarning>{name}</span>
                </Link>
              );
            })}

            {/* User */}
            {hydrated && user && (
              <Link
                href="/organizers/settings"
                className="mt-2 flex items-center gap-2 cursor-pointer p-2 rounded-full hover:bg-primary-50 transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/20 shadow-sm">
                  <Image
                    key={user.image || "placeholder"}
                    src={
                      user.image && user.image.trim() !== ""
                        ? user.image
                        : "/images/placeholder.jpg"
                    }
                    alt={user.name}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <span className="text-sm font-medium text-primary">
                  {user.name}
                </span>
              </Link>
            )}

            {!hydrated && (
              <div className="flex items-center gap-2 mx-2 opacity-50">
                <span className="h-3 w-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="relative inline-flex h-6 w-12 rounded-full bg-gray-200 animate-pulse" />
                <span className="h-3 w-16 rounded-full bg-gray-200 animate-pulse" />
              </div>
            )}

            {hydrated && user && isOrganizer && (
              <div className="flex items-center gap-2 mx-2 opacity-50">
                <div
                  className={`relative inline-flex h-6 w-12 items-center rounded-full px-1 transition-colors duration-300 
      ${isOrganizer ? "bg-primary justify-end" : "bg-gray-300 justify-start"}`}
                >
                  <span className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-300" />
                </div>

                <span
                  className={`text-sm font-medium ${
                    scrolled || !transparent
                      ? "text-gray-600"
                      : "text-primary-700"
                  }`}
                >
                  Organizer
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
