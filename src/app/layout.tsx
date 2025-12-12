import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import { Providers } from "./Providers";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TikEven",
  description: "Event ticketing app.",
  icons: {
    icon: { url: "/icon.png", type: "image/png" },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLang = (cookieStore as any)?.get?.("lang")?.value;
  const normalizedLang = (cookieLang || "en").split("-")[0] as "en" | "ar";
  const dir = normalizedLang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={normalizedLang} dir={dir}>
      <body className={`${poppins.variable} ${inter.variable} antialiased`}>
        <main className="grow">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
