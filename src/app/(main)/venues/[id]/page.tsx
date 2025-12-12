/** @format */
"use client";

import "@/i18n/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/features";
import { getVenueByIdRedux } from "@/lib/features/venueSlice";
import { fetchEventsByVenue } from "@/lib/features/eventSlice";
import { MapPin, Users, ArrowLeft, Mic2, Map, Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/client";
import VenueMap from "@/components/VenueMap";

export default function VenueDetailsPage() {
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedVenue: venue, loading: venueLoading } = useSelector(
    (state: RootState) => state.venues
  );
  const { events, loading: eventsLoading } = useSelector(
    (state: RootState) => state.events
  );
  const { t } = useTranslation();

  useEffect(() => {
    if (id && typeof id === "string") {
      dispatch(getVenueByIdRedux(id));
      dispatch(fetchEventsByVenue(id));
    }
  }, [id, dispatch]);

  if (venueLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground px-6 py-10 flex justify-center items-center">
        <p className="text-xl text-muted-foreground">
          {t("venue_loading_details", {
            defaultValue: "Loading venue details...",
          })}
        </p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-background text-foreground px-6 py-10 flex justify-center items-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">
            {t("venue_not_found", { defaultValue: "Venue not found" })}
          </p>
          <Link href="/venues" className="text-primary hover:underline">
            {t("back_to_venues", { defaultValue: "← Back to Venues" })}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-10 md:px-16 transition-colors duration-300">
      {/* 🧭 Breadcrumb */}
      <div className="flex flex-wrap gap-2 text-sm mb-6 text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          {t("breadcrumb_home", { defaultValue: "Home" })}
        </Link>
        <span>/</span>
        <Link href="/venues" className="hover:text-primary">
          {t("venues_breadcrumb", { defaultValue: "Venues" })}
        </Link>
        <span>/</span>
        <span className="text-primary font-semibold">{venue.title}</span>
      </div>

      {/* 🔙 Back Button */}
      <button
        onClick={() => window.history.back()}
        className="mb-6 inline-flex items-center gap-2 text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("back", { defaultValue: "Back" })}
      </button>

      {/* 🎤 Venue Header */}
      <div className="grid lg:grid-cols-5 gap-10">
        {/* Left Side (Images) */}
        <div className="lg:col-span-3 space-y-4">
          {venue.images && venue.images.length > 0 ? (
            <>
              <div
                className="w-full rounded-2xl overflow-hidden min-h-[400px] bg-center bg-cover shadow-lg"
                style={{ backgroundImage: `url(${venue.images[0]})` }}
              ></div>

              {venue.images.length > 1 && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
                  {venue.images.slice(1).map((img, i) => (
                    <div
                      key={i}
                      className="aspect-video rounded-lg bg-cover bg-center cursor-pointer hover:opacity-90 transition"
                      style={{ backgroundImage: `url(${img})` }}
                    ></div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full rounded-2xl overflow-hidden min-h-[400px] bg-gray-200 flex items-center justify-center">
              <p className="text-gray-500">
                {t("no_images_available", {
                  defaultValue: "No images available",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Right Side (Info) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 🎤 Title with icon */}
          <div className="flex items-center gap-2 mb-2">
            <Mic2 className="w-6 h-6 text-primary" />
            <h1 className="text-4xl font-extrabold text-primary">
              {venue.title}
            </h1>
          </div>

          <div className="p-5 border border-border rounded-xl bg-card shadow-sm space-y-4">
            {/* 📍 Address */}
            <div>
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {t("venues_modal_address", { defaultValue: "Address" })}
              </h3>
              <p>{venue.address}</p>
              <p className="text-muted-foreground text-sm">
                {venue.city}, {venue.country}
              </p>
            </div>

            {/* 👥 Capacity */}
            {venue.capacity && (
              <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {t("venues_new_field_capacity", { defaultValue: "Capacity" })}
                </h3>
                <p>
                  {venue.capacity.toLocaleString()}{" "}
                  {t("people_label", { defaultValue: "people" })}
                </p>
              </div>
            )}
          </div>

          {/* ℹ️ About */}
          {venue.description && (
            <div>
              <h2 className="text-xl font-semibold text-primary mb-2">
                {t("about_section_title", { defaultValue: "About" })}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {venue.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 🗺️ Map Section */}
      <div className="mt-14">
        <div className="flex items-center gap-2 mb-3">
          <Map className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold text-primary">
            {t("location", { defaultValue: "Location" })}
          </h2>
        </div>
        <VenueMap
          latitude={
            typeof venue?.latitude === "number"
              ? (venue.latitude as number)
              : undefined
          }
          longitude={
            typeof venue?.longitude === "number"
              ? (venue.longitude as number)
              : undefined
          }
          address={venue?.address}
          city={venue?.city}
          country={venue?.country}
          title={venue?.title}
        />
      </div>

      {/* 🎫 Events Section */}
      <div className="mt-14">
        <div className="flex items-center gap-2 mb-6">
          <Ticket className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-primary">
            {t("venue_upcoming_events", {
              title: venue.title,
              defaultValue: `Upcoming Events at ${venue.title}`,
            })}
          </h2>
        </div>

        {eventsLoading ? (
          <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center">
            <p className="text-muted-foreground">
              {t("loading_events", { defaultValue: "Loading events..." })}
            </p>
          </div>
        ) : events.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition p-4"
              >
                {event.images && event.images.length > 0 ? (
                  <div
                    className="aspect-video bg-cover bg-center rounded-lg mb-3"
                    style={{ backgroundImage: `url(${event.images[0]})` }}
                  ></div>
                ) : (
                  <div className="aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-gray-400">
                      {t("no_image", { defaultValue: "No image" })}
                    </span>
                  </div>
                )}
                <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  {new Date(event.startDate).toLocaleDateString(
                    i18n.language === "ar" ? "ar-EG" : "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
                {event.description && (
                  <p className="text-muted-foreground text-xs line-clamp-2 mb-3">
                    {event.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-primary font-bold">
                    {event.isFree
                      ? t("free", { defaultValue: "Free" })
                      : `$${event.price}`}
                  </span>
                  <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-bold hover:bg-secondary/90 transition text-sm">
                    {t("view_details", { defaultValue: "View Details" })}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center">
            <p className="text-muted-foreground">
              {t("venue_no_upcoming_events", {
                defaultValue:
                  "No upcoming events at this venue yet. Check back soon!",
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
