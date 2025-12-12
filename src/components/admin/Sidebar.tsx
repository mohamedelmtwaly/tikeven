import SidebarItem from "@/components/SidebarItem";

export default function Sidebar() {
  const links = [
    { href: "/admin", icon: "LayoutDashboard", label: "Dashboard" },
    { href: "/admin/categories", icon: "Layers2", label: "Categories" },
    { href: "/admin/organizers", icon: "UsersRound", label: "Organizers" },
    { href: "/admin/events", icon: "CalendarDays", label: "Events" },
    // { href: "/admin/settings", icon: "Settings", label: "Settings" },
  ];

  return (
    <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-18 flex flex-col items-center bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white shadow-md z-40">
      <nav className="flex flex-col justify-between h-full p-3">
        <div className="flex flex-col items-center gap-2 mt-4">
          {links.map((link) => (
            <SidebarItem key={link.label} {...link} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
