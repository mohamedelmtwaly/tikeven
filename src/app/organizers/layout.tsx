import Sidebar from "@/components/Sidebar";
import Nav from "@/components/Nav";
import { cookies } from "next/headers";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieLang = (cookieStore as any)?.get?.("lang")?.value;
  const normalizedLang = (cookieLang || "en").split("-")[0] as "en" | "ar";
  const isRtl = normalizedLang === "ar";
  console.log(isRtl, normalizedLang);

  return (
    <div>
      <Nav />
      <div className="flex">
        <Sidebar isRtl={isRtl} />
        <main
          className={`${
            isRtl ? "mr-20" : "ml-20"
          } flex-1 p-6 bg-gray-50 pt-20`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}