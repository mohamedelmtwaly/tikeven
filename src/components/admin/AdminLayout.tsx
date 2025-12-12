'use client';

import Sidebar from "./Sidebar";
import Nav from "./Nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Nav />
      <div>
        <Sidebar />
        <main className="ml-20 flex-1 p-6 bg-gray-50 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
