"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers2,
  UsersRound,
  Settings,
  CalendarDays,
  BarChart3,
  Pin,
  Ticket,
  ScanQrCode 
} from "lucide-react";

interface SidebarItemProps {
  href: string;
  icon: string;
  label: string;
  dir?: "ltr" | "rtl";
}

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Layers2,
  UsersRound,
  Settings,
  CalendarDays,
  BarChart3,
  Pin,
  Ticket,
  ScanQrCode
};

export default function SidebarItem({ href, icon, label, dir = "ltr" }: SidebarItemProps) {
  const pathname = usePathname();
  const isRtl = dir === "rtl";
  const isActive =
    href === "/organizers" || href ===  "/admin"
      ? pathname === "/organizers" || pathname ==="/admin"
      : pathname.startsWith(href);
  const Icon = iconMap[icon];

  return (
    <div className="relative group">
      <Link
        href={href}
        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
          isActive
            ? "bg-primary-50 text-primary dark:bg-primary/20 dark:text-blue-300"
            : "text-neutral-400 hover:bg-primary-50 hover:text-neutral-900"
        }`}
      >
        {Icon && <Icon className="w-6h-6" />}
      </Link>

      <span
        className={`absolute top-1/2 -translate-y-1/2 scale-0 opacity-0 group-hover:opacity-100 group-hover:scale-100 bg-primary-600 text-white text-xs font-medium py-1 px-2 rounded-md shadow-md whitespace-nowrap transition-all duration-200
        ${isRtl ? "right-full mr-2" : "left-full ml-2"}`}
      >
        {label}
      </span>
    </div>
  );
}
