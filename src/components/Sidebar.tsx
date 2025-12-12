import SidebarItem from "./SidebarItem";
import { getServerTranslation  } from "../../src/i18n/server";


export default async function Sidebar({ isRtl = false }: { isRtl?: boolean }) {
  const t = await getServerTranslation();
  const links = [
    { href: "/organizers", icon: "LayoutDashboard", label: t("Dashboard") },
    { href: "/organizers/calendar", icon: "CalendarDays", label: t("Calendar") },
    { href: "/organizers/attendance", icon: "ScanQrCode", label: t("Attendance") },
    { href: "/organizers/events", icon: "Ticket", label: t("Events") },
    { href: "/organizers/venues", icon: "Pin", label: t("Venues") },
    { href: "/organizers/analytics", icon: "BarChart3", label: t("Analytics") },
    { href: "/organizers/settings", icon: "Settings", label: t("Settings") },
  ];

  return (
    <aside
      className={`fixed top-16 ${
        isRtl ? "right-0" : "left-0"
      } h-[calc(100vh-4rem)] w-18 flex flex-col items-center bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white shadow-md z-40`}
    >
      <nav className="flex flex-col justify-between h-full p-3">
        <div className="flex flex-col items-center gap-2 mt-4">
          {links.map((link) => (
            <SidebarItem
              key={link.label}
              dir={isRtl ? "rtl" : "ltr"}
              {...link}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}
