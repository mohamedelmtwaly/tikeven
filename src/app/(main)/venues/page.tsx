/** @format */
"use client";

import "@/i18n/client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "react-redux";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppDispatch, RootState } from "@/lib/features";
import { fetchVenues, Venue as VenueType } from "@/lib/features/venueSlice";

// Dynamic import للفلتر بدون SSR
const VenueFilters = dynamic(() => import("./VenueFilters"), { ssr: false });

export default function VenuesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { venues, loading, error } = useSelector(
    (state: RootState) => state.venues
  );
  const { t } = useTranslation();

  useEffect(() => {
    dispatch(fetchVenues());
  }, [dispatch]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [capacity, setCapacity] = useState<string>("");

  const normalizedSearch = (search || "").toLowerCase();
  const filteredVenues = (venues || []).filter((v: VenueType) => {
    const title = (v?.title ?? "").toString().toLowerCase();
    const vcity = (v?.city ?? "").toString().toLowerCase();
    const vaddr = (v?.address ?? "").toString().toLowerCase();
    const matchesSearch =
      title.includes(normalizedSearch) ||
      vcity.includes(normalizedSearch) ||
      vaddr.includes(normalizedSearch);
    const matchesCity = city ? (v?.city ?? "") === city : true;
    const capVal = typeof v?.capacity === "number" ? v.capacity! : 0;
    const matchesCapacity =
      capacity === "small"
        ? capVal < 3000
        : capacity === "medium"
        ? capVal >= 3000 && capVal < 10000
        : capacity === "large"
        ? capVal >= 10000
        : true;

    return matchesSearch && matchesCity && matchesCapacity;
  });

  const itemsPerPage = 9;
  const totalPages = Math.ceil(filteredVenues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVenues = filteredVenues.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground px-6 py-10 flex justify-center items-center">
        <p className="text-xl text-muted-foreground">{t("public_venues_loading", { defaultValue: "Loading venues..." })}</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background text-foreground px-6 py-10 flex justify-center items-center">
        <p className="text-xl text-red-600">{t("error_prefix", { defaultValue: "Error:" })} {error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-primary mb-3 tracking-tight">
          {t("public_venues_title", { defaultValue: "Discover Our Venues" })}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          {t("public_venues_subtitle", { defaultValue: "Explore a variety of venues across different cities. Use filters to find the perfect place for your next event." })}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row justify-start items-center gap-4 mb-10 w-full max-w-6xl mx-auto">
        {/* Search */}
        <div className="relative w-full lg:w-1/2">
          <Search className="absolute left-3 top-3 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder={t("public_venues_search_placeholder", { defaultValue: "Search by name or city..." })}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input rounded-full pl-10 pr-4 h-10 border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors w-full"
          />
        </div>

        {/* Filters */}
        <div className="flex-1">
          <VenueFilters
            venues={venues as any[]}
            city={city}
            setCity={setCity}
            capacity={capacity}
            setCapacity={setCapacity}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>

      {/* Venues Grid */}
      {currentVenues.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
          {currentVenues.map((venue: VenueType) => (
            <Link key={venue.id} href={`/venues/${venue.id}`}>
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg group">
                <div className="relative">
                  <img
                    src={
                      venue.images && venue.images.length > 0
                        ? venue.images[0]
                        : "https://via.placeholder.com/400x300?text=No+Image"
                    }
                    alt={venue.title}
                    className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <button className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-5 py-2 rounded-full shadow">
                    {t("public_venues_see_events", { defaultValue: "See Events" })}
                  </button>
                </div>
                <div className="p-5 text-center">
                  <h2 className="text-lg font-semibold text-title mb-1">
                    {venue.title}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {venue.city} • {venue.country}
                    {venue.capacity
                      ? ` • ${venue.capacity.toLocaleString()} ${t("capacity_label", { defaultValue: "capacity" })}`
                      : ""}
                  </p>
                  {venue.address && (
                    <p className="text-muted-foreground text-xs mt-1 flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      {venue.address}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground mt-10 text-lg">
          {t("public_venues_empty", { defaultValue: "No venues found matching your filters." })}
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-10">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-border text-primary hover:bg-primary/10 hover:border-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-10 h-10 rounded-full font-semibold border border-border transition-colors ${
                i + 1 === currentPage
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-transparent text-primary hover:bg-primary/10 hover:border-primary"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-border text-primary hover:bg-primary/10 hover:border-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </main>
  );
}
