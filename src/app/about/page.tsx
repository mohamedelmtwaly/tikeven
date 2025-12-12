import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Image from "next/image";
import { getServerTranslation } from "../../i18n/server";

export default async function AboutPage() {
  const t = await getServerTranslation("common");
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav wide />

      <main className="flex-1 font-body">
        
        {/* Hero image */}
        <section className="relative w-full">
          <div className="relative h-[50vh] w-full overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=2000"
              alt={t("about_page.hero_alt")}
              fill
              className="object-cover"
              priority
            />
          </div>
        </section>

        {/* ABOUT US title */}
        <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary">
            {t("about_page.title")}
          </h1>
        </section>

        {/* Main text block */}
        <section className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-2xl font-semibold text-primary mb-4">
              {t("about_page.intro_heading")}
            </h2>
            <p className="text-sm leading-relaxed text-body max-w-prose">
              {t("about_page.intro_body_part1")}
              <br />
              <br />
              {t("about_page.intro_body_part2")}
            </p>
          </div>

          <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600"
              alt={t("about_page.brand_image_alt")}
              fill
              className="object-cover"
            />
          </div>
        </section>

        {/* History section */}
        <section className="mx-auto max-w-6xl px-6 mt-20 grid md:grid-cols-2 gap-12 items-start">

          <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1600"
              alt={t("about_page.history_image_alt")}
              fill
              className="object-cover"
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-primary mb-4">
              {t("about_page.history_heading")}
            </h2>
            <p className="text-sm leading-relaxed text-body max-w-prose">
              {t("about_page.history_body")}
            </p>
          </div>
        </section>

        {/* Promise Section */}
        <section className="mx-auto max-w-6xl px-6 mt-20">
          <h2 className="text-2xl font-semibold text-primary mb-6">
            {t("about_page.promise_heading")}
          </h2>
          <p className="text-sm leading-relaxed text-body max-w-prose mb-10">
            {t("about_page.promise_body")}
          </p>

          <div className="relative h-[50vh] rounded-2xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1560264280-88b68371db39?q=80&w=1600"
              alt={t("about_page.promise_image_alt")}
              fill
              className="object-cover"
            />
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-10 text-center bg-card">
            <h3 className="text-2xl font-semibold text-primary">
              {t("about_page.cta_heading")}
            </h3>
            <p className="text-sm mt-2 text-primary">
              {t("about_page.cta_subheading")}
            </p>
            <a
              href="/register"
              className="inline-block mt-6 rounded-full bg-primary px-8 py-3 text-white text-sm font-semibold shadow-sm hover:bg-primary-600 transition"
            >
              {t("about_page.cta_button")}
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
