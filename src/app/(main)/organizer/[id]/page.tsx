"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/lib/features";
import { fetchUsers, fetchUserById } from "@/lib/features/userSlice";
import { getAllEvents, type EventItem } from "@/lib/events/eventSlice";
import { Facebook, Instagram, Twitter, Mail, ExternalLink } from "lucide-react";
import { fetchVenues, type Venue } from "@/lib/features/venueSlice";
import Image from "next/image";

type EventItemWithVenue = EventItem & {
  venueId?: string;
  startTime?: string;
  image?: string;
};

type VenueWithName = Venue & {
  name: string;
};

export default function OrganizerMainPage() {
  const params = useParams<{ id: string }>();
  const organizerId = useMemo(() => {
    const raw = params?.id;
    if (!raw) return "";
    return decodeURIComponent(String(raw)).trim();
  }, [params]);

  const dispatch = useDispatch();

  const { users, loading: usersLoading } = useSelector(
    (s: RootState) => s.users
  );
  const { allEvents, loading: eventsLoading } = useSelector(
    (s: RootState) => s.eventsInfo as any
  ) as { allEvents: EventItem[]; loading: boolean };
  const { venues } = useSelector(
    (s: RootState) => (s as any).venues || { venues: [] }
  );

  useEffect(() => {
    console.log("Organizer route id:", organizerId);
    console.log("Users count:", users?.length || 0);
    if (!users || users.length === 0) {
      dispatch(fetchUsers() as any);
    }
    // Fetch specific organizer if not found in users list
    if (organizerId && (!users || !users.find((u) => u.id === organizerId))) {
      dispatch(fetchUserById(organizerId) as any);
    }
    if (!allEvents || allEvents.length === 0) {
      dispatch(getAllEvents() as any);
    }
    if (!venues || venues.length === 0) {
      dispatch(fetchVenues() as any);
    }
  }, [dispatch, users, allEvents, organizerId, venues]);

  const organizer = useMemo(() => {
    if (!users) return undefined;
    return users.find((u) => u.id === organizerId);
  }, [users, organizerId]);

  const now = new Date();
  
  const organizerEvents = useMemo(() => {
    if (!allEvents) return { upcoming: [], past: [] };
    
    const events = allEvents.filter(
      (e) => e.organizerId === organizerId
    ) as EventItemWithVenue[];
    
    return events.reduce((acc, event) => {
      const eventDate = event.startDate ? new Date(event.startDate) : null;
      if (eventDate && eventDate >= now) {
        acc.upcoming.push(event);
      } else {
        acc.past.push(event);
      }
      return acc;
    }, { upcoming: [] as EventItemWithVenue[], past: [] as EventItemWithVenue[] });
  }, [allEvents, organizerId, now]);

  const venueMap = useMemo(() => {
    const m: Record<string, VenueWithName> = {};
    (venues as VenueWithName[] | undefined)?.forEach((v) => {
      if (v?.id) m[v.id] = v;
    });
    return m;
  }, [venues]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString)
      .toLocaleDateString("en-US", options)
      .toUpperCase();
  };

  // Guard: invalid id after hooks
  if (!organizerId) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow pt-10">
        <div className="max-w-2xl mx-auto text-center py-16 text-slate-600 dark:text-slate-400">
          Invalid organizer id
        </div>
      </main>
    );
  }

  if (!organizer && (usersLoading || (users?.length ?? 0) === 0)) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow pt-10">
        <div className="max-w-2xl mx-auto text-center py-16 text-slate-600 dark:text-slate-400">
          Loading organizer...
        </div>
      </main>
    );
  }

  if (!organizer) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow pt-10">
        <div className="max-w-2xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Organizer not found</h1>
          <Link href="/" className="text-primary underline">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 mt-10">
      <main className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40 py-5">
        {organizer && (
          <div className="grid grid-cols-12 gap-8">
            {/* Left Sidebar */}
            <div className="col-span-12 lg:col-span-4">
              <div className="flex flex-col gap-8">
                {/* Profile Card */}
                <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg mb-4 -mt-16">
                    <Image
                      src={organizer.image || "/images/organizer_placeholder.png"}
                      alt={organizer.name || "Organizer"}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {organizer.name}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                    {"Event Organizer"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm mt-4">
                    {organizer.description ||
                      "No description available for this organizer."}
                  </p>
                </div>

                {/* Social Media */}
                <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                    Follow on Social Media
                  </h3>
                  <div className="flex items-center gap-4">
                    <a
                      href="#"
                      className="text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors"
                      title="Facebook"
                    >
                      <Facebook className="w-6 h-6" />
                    </a>
                    <a
                      href="#"
                      className="text-slate-500 dark:text-slate-400 hover:text-pink-600 transition-colors"
                      title="Instagram"
                    >
                      <Instagram className="w-6 h-6" />
                    </a>
                    <a
                      href="#"
                      className="text-slate-500 dark:text-slate-400 hover:text-blue-400 transition-colors"
                      title="Twitter"
                    >
                      <Twitter className="w-6 h-6" />
                    </a>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                    Contact Information
                  </h3>
                  <div className="flex flex-col gap-3">
                    {organizer.email && (
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <span className="text-sm">{organizer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                {/* Upcoming Events Section */}
                <div className="mb-12">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-blue-800">
                      Upcoming Events
                    </h2>
                    {/* {organizerEvents.upcoming.length > 2 && (
                      <Link 
                        href={`/organizers/${organizerId}/events?filter=upcoming`}
                        className="text-sm text-blue-600 hover:underline flex items-center"
                      >
                        View all <ExternalLink className="ml-1 w-3 h-3" />
                      </Link>
                    )} */}
                  </div>

                  {organizerEvents.upcoming.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {organizerEvents.upcoming.slice(0, 2).map((event) => {
                      const venue = event.venueId
                        ? venueMap[event.venueId]
                        : null;
                      return (
                        <div
                          key={event.id}
                          className="flex flex-col gap-3 group bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 transition-shadow hover:shadow-xl"
                        >
                          <div className="w-full bg-center bg-no-repeat aspect-video bg-cover overflow-hidden">
                            {event.image ? (
                              <Image
                                src={event.image}
                                alt={event.title}
                                width={400}
                                height={225}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                <span className="text-slate-400 dark:text-slate-500">
                                  No Image
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex flex-col flex-grow">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                              {event.startDate
                                ? formatDate(event.startDate)
                                : "Date TBD"}
                            </p>
                            <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-normal mt-1 flex-grow">
                              {event.title}
                            </h3>
                            {venue && (
                              <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal mt-1">
                                {venue.name}
                              </p>
                            )}
                            <Link
                              href={`/events/${event.id}`}
                              className="w-full mt-4 flex items-center justify-center h-10 px-4 bg-blue-800/10 text-blue-800 dark:bg-blue-800/20 dark:text-white text-sm font-bold rounded-lg hover:bg-blue-800/20 dark:hover:bg-blue-800/30 transition-colors"
                            >
                              View Event
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                    <p className="text-slate-500 dark:text-slate-400">
                      No upcoming events scheduled.
                    </p>
                  </div>
                )}
                </div>

                {/* Past Events Section */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-blue-800">
                      Past Events
                    </h2>
                    {/* {organizerEvents.past.length > 2 && (
                      <Link 
                        href={`/organizers/${organizerId}/events?filter=past`}
                        className="text-sm text-blue-600 hover:underline flex items-center"
                      >
                        View all <ExternalLink className="ml-1 w-3 h-3" />
                      </Link>
                    )} */}
                  </div>

                  {organizerEvents.past.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {organizerEvents.past.slice(0, 2).map((event) => {
                        const venue = event.venueId
                          ? venueMap[event.venueId]
                          : null;
                        return (
                          <div
                            key={event.id}
                            className="flex flex-col gap-3 group bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 transition-shadow hover:shadow-xl opacity-80 hover:opacity-100"
                          >
                            <div className="w-full bg-center bg-no-repeat aspect-video bg-cover overflow-hidden">
                              {event.image ? (
                                <Image
                                  src={event.image}
                                  alt={event.title}
                                  width={400}
                                  height={225}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                  <span className="text-slate-400 dark:text-slate-500">
                                    No Image
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                {event.startDate
                                  ? formatDate(event.startDate)
                                  : "Date TBD"}
                              </p>
                              <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-normal mt-1 flex-grow">
                                {event.title}
                              </h3>
                              {venue && (
                                <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal mt-1">
                                  {venue.name}
                                </p>
                              )}
                              <Link
                                href={`/events/${event.id}`}
                                className="w-full mt-4 flex items-center justify-center h-10 px-4 bg-blue-800/10 text-blue-800 dark:bg-blue-800/20 dark:text-white text-sm font-bold rounded-lg hover:bg-blue-800/20 dark:hover:bg-blue-800/30 transition-colors"
                              >
                                View Event
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                      <p className="text-slate-500 dark:text-slate-400">
                        No past events found.
                      </p>
                    </div>
                  )}
                </div>

                {(organizerEvents.upcoming.length > 2 || organizerEvents.past.length > 2) && (
                  <div className="mt-8 text-center">
                    <Link
                      href={`/organizers/${organizerId}/events`}
                      className="inline-flex items-center text-blue-800 dark:text-blue-400 hover:underline"
                    >
                      View all events <ExternalLink className="ml-1 w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
