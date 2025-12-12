/** @format */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { createNotification } from "@/utils/notifications";
import { Event, EventsState, CreateEventData, EventStatus } from "@/types/event";
import { uploadMultipleImagesToImgbb } from "@/services/imgbb/storeImg";

const initialState: EventsState = {
  events: [],
  loading: true,
  error: null,
  currentEvent: null,
};

// Helper: Extract string ID from DocumentReference or return string
const extractId = (value: any): string => {
  if (!value) return "";
  // If it's a DocumentReference (has _key property)
  if (typeof value === "object" && value._key) {
    return value._key.path.segments[value._key.path.segments.length - 1];
  }
  // If it's an object with id property
  if (typeof value === "object" && value.id) {
    return value.id;
  }
  // If it's already a string
  if (typeof value === "string") {
    return value;
  }
  return "";
};

// Helper: Get organizer ID from localStorage
const getOrganizerId = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  const userStr = localStorage.getItem("user");
  if (!userStr) return undefined;
  try {
    const user = JSON.parse(userStr);
    return user.uid || user.id;
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
    return undefined;
  }
};

// Helper: Upload images and handle errors
const uploadImages = async (images: File[], rejectWithValue: any) => {
  if (!images || images.length === 0) return [];
  try {
    return await uploadMultipleImagesToImgbb(images);
  } catch (error: any) {
    console.error("imgbb upload error:", error);
    return rejectWithValue(
      error.message ||
        "Failed to upload images. Please check your imgbb API key in .env.local"
    );
  }
};

// Fetch all events
export const fetchEvents = createAsyncThunk(
  "events/fetchEvents",
  async (_, { rejectWithValue }) => {
    try {
      const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const organizerIdSet = new Set<string>();

      // First pass: collect organizer IDs
      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const organizerId = extractId(data.organizer) || data.organizerId;
        if (organizerId) organizerIdSet.add(String(organizerId));
      });

      // Load organizer names from users collection (organizers are stored as users)
      const organizerNames: Record<string, string> = {};
      await Promise.all(
        Array.from(organizerIdSet).map(async (id) => {
          try {
            const ref = doc(db, "users", id);
            const snap = await getDoc(ref);
            if (snap.exists()) {
              const data = snap.data() as any;
              organizerNames[id] =
                data?.name || data?.displayName || data?.email || id;
            }
          } catch {
            // Ignore errors and fall back to ID
          }
        })
      );

      // Second pass: build Event objects including organizerName
      const events: Event[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        const organizerId = extractId(data.organizer) || data.organizerId;
        const organizerIdStr = organizerId ? String(organizerId) : undefined;

        return {
          id: docSnapshot.id,
          title: data.title,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          venue: extractId(data.venue),
          venueData: data.venueData || { id: "", name: "", address: "" },
          category: extractId(data.category),
          price: data.price,
          isFree: data.isFree,
          ticketsCount: data.ticketsCount,
          images: data.images || [],
          organizerId: organizerIdStr,
          organizerName:
            (organizerIdStr && organizerNames[organizerIdStr]) || undefined,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          status: data.status as EventStatus,
        } as Event;
      });
      return events;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Update only event status with notification
export const updateEventStatus = createAsyncThunk(
  "events/updateEventStatus",
  async (
    { id, status }: { id: string; status: EventStatus },
    { rejectWithValue }
  ) => {
    try {
      const eventRef = doc(db, "events", id);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }

      const eventData = eventDoc.data();
      const organizerId = eventData.organizerId || eventData.organizer?.id;

      // Update the event status
      await updateDoc(eventRef, { status });

      // Create notification for the organizer if status is published or banned
      if ((status === EventStatus.PUBLISHED || status === EventStatus.BANNED) && organizerId) {
        const notificationType = status === EventStatus.PUBLISHED ? 'event_published' : 'event_banned';
        const title = status === EventStatus.PUBLISHED 
          ? 'Event Published' 
          : 'Event Banned';
        const message = status === EventStatus.PUBLISHED
          ? `Your event "${eventData.title}" has been published and is now live.`
          : `Your event "${eventData.title}" has been banned. Please contact support for more information.`;
          
        await createNotification({
          userId: organizerId,
          type: notificationType,
          title,
          message,
          link: `/events/${id}`,
          relatedId: id
        });
      }
      
      return { id, status };
    } catch (error: any) {
      console.error("Error updating event status:", error);
      return rejectWithValue(error.message || "Failed to update event status");
    }
  }
);

// Fetch events by organizer ID
export const fetchEventsByOrganizer = createAsyncThunk(
  "events/fetchEventsByOrganizer",
  async (organizerId: string, { rejectWithValue }) => {
    try {
      console.log("🔍 Fetching events for organizer:", organizerId);

      // First, get the organizer's details
      let organizerName = "";
      try {
        const organizerDoc = await getDoc(doc(db, "users", organizerId));
        if (organizerDoc.exists()) {
          const organizerData = organizerDoc.data();
          organizerName = organizerData.name || organizerData.displayName || "Unknown Organizer";
        }
      } catch (error) {
        console.error("Error fetching organizer details:", error);
      }

      // Fetch all events and filter in memory
      // This works for both old events (with organizerId string) and new events (with organizer reference)
      const snapshot = await getDocs(collection(db, "events"));

      console.log("📦 Total events in database:", snapshot.size);

      const events: (Event & { organizerName?: string })[] = [];
      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();

        // Check if this event belongs to the organizer
        // Support both old format (organizerId string) and new format (organizer reference)
        const eventOrganizerId = data.organizer?.id || data.organizerId;

        console.log(
          "📝 Event:",
          docSnapshot.id,
          "Organizer:",
          eventOrganizerId
        );

        if (eventOrganizerId === organizerId) {
          events.push({
            id: docSnapshot.id,
            title: data.title,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            venue: extractId(data.venue),
            venueData: data.venueData || { id: "", name: "", address: "" },
            category: extractId(data.category),
            price: data.price,
            isFree: data.isFree,
            ticketsCount: data.ticketsCount,
            images: data.images || [],
            organizerId: extractId(data.organizer) || data.organizerId,
            organizerName: organizerName, // Add organizer's name to the event
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            status: data.status as EventStatus,
          } as Event & { organizerName: string });
        }
      });

      console.log("✅ Found", events.length, "events for organizer");

      // Sort by createdAt desc
      events.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      return events;
    } catch (error: any) {
      console.error("❌ Error fetching events:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Fetch single event by ID
export const fetchEventById = createAsyncThunk(
  "events/fetchEventById",
  async (eventId: string, { rejectWithValue }) => {
    try {
      const docRef = doc(db, "events", eventId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const venueRef = data.venue;
        let selectedVenue = { id: "", name: "", address: "" };

        if (venueRef) {
          try {
            const venueDocRef =
              typeof venueRef === "string" ? doc(db, "venues", venueRef) : venueRef;
            const venue = await getDoc(venueDocRef);
            if (venue.exists()) {
              const venueData = venue.data() as any;
              selectedVenue = {
                id: venueData?.id || venue.id,
                name: venueData?.name || "",
                address: venueData?.address || "",
              };
            }
          } catch (venueError) {
            console.warn("Error fetching venue data:", venueError);
          }
        }

        return {
          id: docSnap.id,
          title: data.title,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          venue: extractId(data.venue) || selectedVenue.id,
          venueData: selectedVenue,
          category: extractId(data.category),
          price: data.price,
          isFree: data.isFree,
          ticketsCount: data.ticketsCount,
          images: data.images || [],
          organizerId: extractId(data.organizer) || data.organizerId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          status: data.status as EventStatus,
        } as Event;
      } else {
        return rejectWithValue("Event not found");
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch events by venue ID
export const fetchEventsByVenue = createAsyncThunk(
  "events/fetchEventsByVenue",
  async (venueId: string, { rejectWithValue }) => {
    try {
      // Try with orderBy first
      let q = query(
        collection(db, "events"),
        where("venue", "==", venueId),
        orderBy("startDate", "asc")
      );

      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (indexError: any) {
        // If composite index error, try without orderBy
        console.warn(
          "Firebase index not found, querying without orderBy:",
          indexError.message
        );
        q = query(collection(db, "events"), where("venue", "==", venueId));
        snapshot = await getDocs(q);
      }

      const events: Event[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          venue: extractId(data.venue),
          venueData: data.venueData || { id: "", name: "", address: "" },
          category: extractId(data.category),
          price: data.price,
          isFree: data.isFree,
          ticketsCount: data.ticketsCount,
          images: data.images || [],
          organizerId: extractId(data.organizer) || data.organizerId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          status: data.status as EventStatus,
        } as Event;
      });

      // Sort by startDate in JavaScript if needed
      events.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      console.log(`Found ${events.length} events for venue ${venueId}`);
      if (events.length === 0) {
        console.log("No events found. Checking all events in database...");
        // Fetch all events to debug
        const allEventsSnapshot = await getDocs(collection(db, "events"));
        const allEvents = allEventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          venue: doc.data().venue,
          venueType: typeof doc.data().venue,
          title: doc.data().title,
        }));
        console.table(allEvents);
        console.log(
          `Looking for venue ID: "${venueId}" (type: ${typeof venueId})`
        );
        console.log(
          "Venue IDs in events:",
          allEvents.map((e) => `"${e.venue}" (${e.venueType})`)
        );
      }
      return events;
    } catch (error: any) {
      console.error("Error fetching events by venue:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Create new event
export const createEvent = createAsyncThunk(
  "events/createEvent",
  async (eventData: CreateEventData, { rejectWithValue }) => {
    try {
      const imageUrls = await uploadImages(
        eventData.images || [],
        rejectWithValue
      );
      const organizerId = getOrganizerId();

      // Prepare event data for Firestore (exclude undefined values)
      const newEvent: any = {
        title: eventData.title,
        description: eventData.description,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        venue: eventData.venue,
        category: eventData.category,

        price: eventData.isFree ? 0 : eventData.price,
        isFree: eventData.isFree,
        ticketsCount: eventData.ticketsCount,
        images: imageUrls,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: EventStatus.PUBLISHED,
      };

      // Add organizer reference if exists (Firebase doesn't accept undefined)
      if (organizerId) {
        newEvent.organizer = doc(db, "users", organizerId); // DocumentReference
      }

      try {
        const docRef = await addDoc(collection(db, "events"), newEvent);

        // Return event with organizerId as string for Redux state
        return {
          id: docRef.id,
          title: newEvent.title,
          description: newEvent.description,
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          venue: eventData.venue,
          category: eventData.category,
          price: newEvent.price,
          isFree: newEvent.isFree,
          ticketsCount: newEvent.ticketsCount,
          images: newEvent.images,
          organizerId: organizerId || undefined,
          createdAt: newEvent.createdAt,
          updatedAt: newEvent.updatedAt,
          status: newEvent.status,
        } as Event;
      } catch (firebaseError: any) {
        console.error("Firebase error:", firebaseError);
        return rejectWithValue(
          "Failed to save event to database. Please check your Firebase configuration."
        );
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      return rejectWithValue(error.message || "An unexpected error occurred");
    }
  }
);

// Update event
export const updateEvent = createAsyncThunk(
  "events/updateEvent",
  async (
    { id, ...eventData }: { id: string } & Partial<CreateEventData>,
    { rejectWithValue }
  ) => {
    try {
      const docRef = doc(db, "events", id);

      const beforeSnap = await getDoc(docRef);
      const beforeData = beforeSnap.exists() ? beforeSnap.data() : undefined;

      const imageUrls =
        eventData.images && eventData.images.length > 0
          ? await uploadImages(eventData.images, rejectWithValue)
          : undefined;
      const organizerId = getOrganizerId();

      // Prepare update data
      const updateData: any = {
        ...eventData,
        ...(imageUrls && { images: imageUrls }),
        ...(organizerId && { organizer: doc(db, "users", organizerId) }), // Add organizer reference
        updatedAt: new Date().toISOString(),
      };

      // Remove images field if it contains File objects
      if (updateData.images && typeof updateData.images[0] === "object") {
        delete updateData.images;
      }

      // Remove undefined values (Firebase doesn't accept undefined)
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      try {
        await updateDoc(docRef, updateData);

        // Fetch updated event
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        if (!data) {
          return rejectWithValue("Event not found after update");
        }
        {
          const toISO = (v: any) => {
            try {
              if (!v) return v;
              if (v?.toDate) return v.toDate().toISOString();
              if (v instanceof Date) return v.toISOString();
              if (typeof v === "string") return v;
              return v;
            } catch {
              return v;
            }
          };
          const toComparable = (k: string, v: any) => {
            if (k === "venue" || k === "category") return extractId(v);
            if (k === "startDate" || k === "endDate") return toISO(v);
            return v;
          };
          const tracked = [
            "title",
            "description",
            "startDate",
            "endDate",
            "venue",
            "category",
            "price",
            "isFree",
            "ticketsCount",
          ];
          const changes: any = {};
          try {
            for (const k of tracked) {
              const b = beforeData ? toComparable(k, (beforeData as any)[k]) : undefined;
              const a = toComparable(k, (data as any)[k]);
              const same = JSON.stringify(b) === JSON.stringify(a);
              if (!same && !(b === undefined && a === undefined)) {
                (changes as any)[k] = { before: b, after: a };
              }
            }
          } catch {}
          if (Object.keys(changes).length > 0) {
            try {
              const dateChanged = Boolean((changes as any).startDate || (changes as any).endDate);
              await fetch("/api/event-update-notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  eventId: id,
                  changes,
                  event: {
                    title: (data as any).title,
                    startDate: (data as any).startDate,
                    endDate: (data as any).endDate,
                    venue: extractId((data as any).venue),
                  },
                  onlyConfirmed: !dateChanged,
                }),
              });
            } catch {}
          }
        }
        return {
          id: docSnap.id,
          title: data.title,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          venue: extractId(data.venue),
          category: extractId(data.category),
          price: data.price,
          isFree: data.isFree,
          ticketsCount: data.ticketsCount,
          images: data.images || [],
          organizerId: data.organizer?.id || data.organizerId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          status: data.status as EventStatus,
        } as Event;
      } catch (firebaseError: any) {
        console.error("Firebase error:", firebaseError);
        return rejectWithValue(
          "Failed to update event in database. Please check your Firebase configuration."
        );
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      return rejectWithValue(error.message || "An unexpected error occurred");
    }
  }
);

// Delete event
export const deleteEvent = createAsyncThunk(
  "events/deleteEvent",
  async (eventId: string, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(db, "events", eventId));
      return eventId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all events
      .addCase(
        fetchEvents.fulfilled,
        (state, action: PayloadAction<Event[]>) => {
          state.events = action.payload;
          state.loading = false;
        }
      )

      // Fetch events by organizer
      .addCase(
        fetchEventsByOrganizer.fulfilled,
        (state, action: PayloadAction<Event[]>) => {
          state.events = action.payload;
          state.loading = false;
        }
      )

      // Fetch event by ID
      .addCase(
        fetchEventById.fulfilled,
        (state, action: PayloadAction<Event>) => {
          state.currentEvent = action.payload;
          state.loading = false;
        }
      )

      // Fetch events by venue
      .addCase(
        fetchEventsByVenue.fulfilled,
        (state, action: PayloadAction<Event[]>) => {
          state.events = action.payload;
          state.loading = false;
        }
      )

      // Create event
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.events.unshift(action.payload);
        state.loading = false;
      })

      // Update event
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        const index = state.events.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        state.currentEvent = action.payload;
        state.loading = false;
      })

      .addCase(
        updateEventStatus.fulfilled,
        (state, action: PayloadAction<{ id: string; status: EventStatus }>) => {
          const event = state.events.find((e) => e.id === action.payload.id);
          if (event) {
            event.status = action.payload.status;
          }
          if (state.currentEvent && state.currentEvent.id === action.payload.id) {
            state.currentEvent.status = action.payload.status;
          }
          state.loading = false;
        }
      )

      // Delete event
      .addCase(
        deleteEvent.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.events = state.events.filter((e) => e.id !== action.payload);
          state.loading = false;
        }
      )

      // Handle pending states ONLY for events/* actions,
      // but exclude updateEventStatus so status changes don't trigger global loading
      .addMatcher(
        (action) =>
          action.type.startsWith("events/") &&
          action.type.endsWith("/pending") &&
          !action.type.startsWith("events/updateEventStatus"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      // Handle rejected states ONLY for events/* actions
      .addMatcher(
        (action) => action.type.startsWith("events/") && action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export const { clearCurrentEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
