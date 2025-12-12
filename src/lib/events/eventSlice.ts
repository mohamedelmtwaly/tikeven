import { db } from "@/services/firebase/config";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { collection, getDocs } from "firebase/firestore";

export interface EventItem {
  id: string;
  title: string;
  // Firestore venue id (foreign key to venues collection)
  venue: string;
  price: number;
  image: string;
  startDate: string; // ISO
  endDate: string; // ISO
  descriptionOrganizer: string;
  isFree: boolean;
  // Category id (normalized from string or reference)
  category: string;
  // Organizer information derived from Firestore reference or string path
  organizerId?: string;
  organizerPath?: string;
}

interface EventsState {
  allEvents: EventItem[];
  loading: boolean;
  error: string | null;
}

export let getAllEvents = createAsyncThunk<EventItem[], void, { rejectValue: string }>("eventSlice/getAllEvents", async (_, thunkApi) => {
  console.log(" db instance:", db);

  const eventsCollectionsRef = collection(db, "events");

  try {
    const response = await getDocs(eventsCollectionsRef);
    console.log(response);

    const data: EventItem[] = response.docs.map((doc) => {
      const raw: any = doc.data();
      const toISO = (v: any): string => {
        try {
          if (!v) return "";
          // Firestore Timestamp
          if (typeof v?.toDate === "function") return v.toDate().toISOString();
          // String date
          const d = new Date(v);
          return isNaN(d.getTime()) ? String(v) : d.toISOString();
        } catch {
          return String(v ?? "");
        }
      };

      const priceNum = Number(raw?.price ?? 0);

      const rawCategory = raw?.category;
      let categoryId = "";
      if (typeof rawCategory === "string") {
        categoryId = rawCategory;
      } else if (rawCategory && typeof rawCategory === "object") {
        if (typeof (rawCategory as any).id === "string") {
          categoryId = (rawCategory as any).id;
        } else if ((rawCategory as any)._key?.path?.segments) {
          const segments = (rawCategory as any)._key.path.segments as string[];
          categoryId = segments[segments.length - 1] || "";
        }
      }

      const rawOrganizer = raw?.organizer;
      let organizerId = "";
      let organizerPath = "";
      if (typeof rawOrganizer === "string") {
        organizerPath = rawOrganizer;
        const parts = rawOrganizer.split("/");
        organizerId = parts[parts.length - 1] || "";
      } else if (rawOrganizer && typeof rawOrganizer === "object") {
        if (typeof (rawOrganizer as any).id === "string") {
          organizerId = (rawOrganizer as any).id;
        } else if ((rawOrganizer as any)._key?.path?.segments) {
          const segments = (rawOrganizer as any)._key.path.segments as string[];
          organizerId = segments[segments.length - 1] || "";
        }
        if (typeof (rawOrganizer as any).path === "string") {
          organizerPath = (rawOrganizer as any).path;
        }
      }

      return {
        id: doc.id,
        title: String(raw?.title ?? ""),
        venue: String(raw?.venue ?? ""),
        category: categoryId,
        price: isNaN(priceNum) ? 0 : priceNum,
        image: String((Array.isArray(raw?.images) ? raw.images[0] : raw?.image) ?? ""),
        startDate: toISO(raw?.startDate),
        endDate: toISO(raw?.endDate),
        descriptionOrganizer: String(raw?.description ?? ""),
        isFree: Boolean(raw?.isFree ?? priceNum === 0),
        organizerId,
        organizerPath,
      };
    });

    if (data.length > 0) {
      console.log("Database contains data:", data);
    } else {
      console.warn(" No data found in 'events' collection!");
    }

    return data;
  } catch (err: any) {
    console.error("Failed to fetch events:", err);
    return thunkApi.rejectWithValue(err?.message || "Failed to fetch events");
  }
});

let eventsSlice = createSlice({
  name: "eventsSlice",
  initialState: {
    allEvents: [],
    loading: false,
    error: null,
  } as EventsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllEvents.fulfilled, (state, action: PayloadAction<EventItem[]>) => {
        state.loading = false;
        state.allEvents = action.payload;
      })
      .addCase(getAllEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Unknown error";
      });
  },
});

export let eventsReducer = eventsSlice.reducer;
