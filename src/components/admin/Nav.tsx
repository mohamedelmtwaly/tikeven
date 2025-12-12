"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bars3Icon,
  XMarkIcon,
  ArrowLeftEndOnRectangleIcon,
  ChevronDownIcon,
  CheckIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { logout } from "@/lib/features/userSlice";
import { signOut } from "firebase/auth";
import { auth } from "@/services/firebase/config";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/client";

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState((i18n.language || "en").split("-")[0]);

  const currentUser = useAppSelector((state) => state.users.currentUser);
  const user = {
    name: currentUser?.name || t('common:guest') || "Guest",
    avatar:
      currentUser?.image ||
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=256&q=80",
  };

  const changeLanguage = async (nextLang: "en" | "ar") => {
    try {
      // Update i18n instance
      await i18n.changeLanguage(nextLang);
      
      // Update UI state
      setCurrentLanguage(nextLang);
      
      // Update document attributes
      document.documentElement.lang = nextLang;
      document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
      
      // Save preference to cookies
      document.cookie = `lang=${nextLang}; path=/; max-age=31536000; samesite=lax`;
      
      // Refresh the page to apply RTL/LTR changes
      router.refresh();
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      dispatch(logout());
      router.push("/admin/login");
    }
  };

  // Initialize language on component mount
  useEffect(() => {
    // Get saved language from cookie or use browser language
    const savedLang = document.cookie.replace(/(?:(?:^|.*;\s*)lang\s*=\s*([^;]*).*$)|^.*$/, '$1') || 
                     (navigator.language || 'en').split('-')[0];
    
    const lang = ['en', 'ar'].includes(savedLang) ? savedLang : 'en';
    
    // Apply the language
    i18n.changeLanguage(lang).then(() => {
      setCurrentLanguage(lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }).catch(console.error);
    
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        if (menuOpen) setMenuOpen(false);
        if (languageMenuOpen) setLanguageMenuOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#language-menu') && !target.closest('button[aria-label="Change language"]')) {
        setLanguageMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, languageMenuOpen]);

  type NavLink = { name: string; href: string };
  const navLinks: NavLink[] = [];
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
  ];

  return (
    <nav
      className="sticky top-0 z-50 w-full bg-white shadow-xs transition-all duration-300"
      dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo + Links */}
          <div className="flex items-center gap-4">
            <Link href="#" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Logo"
                width={70}
                height={70}
                className="object-contain"
              />
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-2">
              {navLinks.map(({ name, href }) => (
                <Link
                  key={name}
                  href={href}
                  className="relative px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors duration-200"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side: Language Switcher / User / Login / Menu */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative group">
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors duration-200"
                  onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                  aria-expanded={languageMenuOpen}
                  aria-haspopup="true"
                  aria-label="Change language"
                >
                  <GlobeAltIcon className="w-5 h-5" />
                  <span>{currentLanguage === 'en' ? 'EN' : 'عربي'}</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${languageMenuOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                <div 
                  id="language-menu"
                  className={`absolute ${languageMenuOpen ? 'block' : 'hidden'} ${currentLanguage === 'ar' ? 'left-0' : 'right-0'} mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50`}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="language-menu-button"
                  onClick={(e) => e.stopPropagation()}
                >
                <div className="py-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${
                        currentLanguage === lang.code 
                          ? 'bg-gray-100 text-primary font-medium' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        changeLanguage(lang.code as 'en' | 'ar');
                        setLanguageMenuOpen(false);
                      }}
                    >
                      <span>{lang.name}</span>
                      {currentLanguage === lang.code && <CheckIcon className="w-4 h-4" />}
                    </button>
                  ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Sign In / Sign Out */}
            <div className="relative group flex items-center">
              <Link
                href={currentUser ? "#" : "/admin/login"}
                className="p-2 rounded-full text-gray-600 hover:text-primary transition-transform duration-200 transform group-hover:scale-110"
                aria-label="Sign In"
                onClick={(e) => {
                  if (currentUser) {
                    e.preventDefault();
                    handleSignOut();
                  }
                }}
              >
                <ArrowLeftEndOnRectangleIcon className="w-5 h-5" />
              </Link>
              <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs font-light text-white bg-primary px-3 py-1 rounded scale-90 group-hover:scale-100 whitespace-nowrap">
                {currentUser ? "Sign Out" : "Sign In"}
              </span>
            </div>

            {/* User Avatar */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-800">
                  {user.name}
                </span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-full text-gray-700 hover:text-primary transition-colors duration-200"
              onClick={() => setMenuOpen((s) => !s)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
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
        <div className="px-4 pt-2 pb-4 border-t border-gray-200 bg-white">
          <div className="flex flex-col gap-3">
            {navLinks.map(({ name, href }) => (
              <Link
                key={name}
                href={href}
                className="block text-gray-700 font-medium py-2 px-2 rounded hover:bg-gray-100 hover:text-primary transition-colors duration-150"
                onClick={() => setMenuOpen(false)}
              >
                {name}
              </Link>
            ))}

            {/* User */}
            {currentUser && (
              <div className="mt-2 flex items-center gap-2 cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-800">
                  {user.name}
                </span>
              </div>
            )}

            {/* Mobile Login / Logout */}
            <Link
              href={currentUser ? "#" : "/admin/login"}
              className="mt-2 flex items-center justify-center gap-2 w-full text-center font-semibold text-white bg-primary py-2 rounded-full hover:bg-primary-600 transition-colors duration-200"
              onClick={(e) => {
                if (currentUser) {
                  e.preventDefault();
                  handleSignOut();
                }
                setMenuOpen(false);
              }}
            >
              <ArrowLeftEndOnRectangleIcon className="w-4 h-4" />
              {currentUser ? "Sign Out" : "Sign In"}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
