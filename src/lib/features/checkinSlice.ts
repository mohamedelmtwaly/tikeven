import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { collection, getDocs, query, where, getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase/config";
import type { Ticket } from "./orderSlice";

export interface CheckinTicket extends Ticket {
  attendeeName?: string;
  attendeeEmail?: string;
}

interface CheckinState {
  tickets: CheckinTicket[];
  loading: boolean;
  error: string | null;
}

const initialState: CheckinState = {
  tickets: [],
  loading: false,
  error: null,
};

// Fetch all tickets for a single event
export const fetchTicketsByEvent = createAsyncThunk<
  CheckinTicket[],
  { eventId: string },
  { rejectValue: string }
>("checkin/fetchTicketsByEvent", async ({ eventId }, { rejectWithValue }) => {
  try {
    const snap = await getDocs(query(collection(db, "tickets"), where("eventId", "==", eventId)));
    const rawTickets = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CheckinTicket[];

    // Enrich with attendee name/email from users collection
    const userIds = Array.from(new Set(rawTickets.map((t) => t.userId).filter(Boolean)));
    const userMap = new Map<string, { name?: string; email?: string }>();
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const u = await getDoc(doc(db, "users", uid));
          if (u.exists()) {
            const data: any = u.data();
            userMap.set(uid, {
              name: data?.displayName || data?.name || `${data?.firstName ?? ""} ${data?.lastName ?? ""}`.trim(),
              email: data?.email,
            });
          }
        } catch {}
      })
    );

    const tickets = rawTickets.map((t) => {
      const meta = userMap.get(t.userId);
      return {
        ...t,
        attendeeName: meta?.name || undefined,
        attendeeEmail: meta?.email || undefined,
      } as CheckinTicket;
    });

    return tickets;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? "Failed to fetch tickets for event");
  }
});

// Check-in a single ticket: mark as checkedIn and stamp time
export const checkInTicket = createAsyncThunk<
  CheckinTicket,
  { ticketId: string },
  { rejectValue: string }
>("checkin/checkInTicket", async ({ ticketId }, { rejectWithValue }) => {
  try {
    const ref = doc(db, "tickets", ticketId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return rejectWithValue("Ticket not found");
    const when = new Date().toISOString();
    await updateDoc(ref, { checkedIn: true, checkedInAt: when });
    const data: any = snap.data();
    return { id: ticketId, ...data, checkedIn: true, checkedInAt: when } as CheckinTicket;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? "Failed to check-in ticket");
  }
});

// Fetch all tickets for ALL events organized by a specific organizer
export const fetchTicketsByOrganizer = createAsyncThunk<
  CheckinTicket[],
  { organizerId: string },
  { rejectValue: string }
>("checkin/fetchTicketsByOrganizer", async ({ organizerId }, { rejectWithValue }) => {
  try {
    // Get events that belong to the organizer (events.organizer ref or organizerId string)
    const eventsSnap = await getDocs(collection(db, "events"));
    const eventIds: string[] = [];
    eventsSnap.forEach((docSnap) => {
      const data: any = docSnap.data();
      const evOrgId = data?.organizer?.id || data?.organizerId;
      if (evOrgId === organizerId) eventIds.push(docSnap.id);
    });

    // Get tickets for each event (Firestore does not support large IN queries well; iterate)
    const allTickets: CheckinTicket[] = [];
    for (const evId of eventIds) {
      const tSnap = await getDocs(query(collection(db, "tickets"), where("eventId", "==", evId)));
      tSnap.forEach((t) => allTickets.push({ id: t.id, ...(t.data() as any) } as CheckinTicket));
    }

    // Enrich with attendee name/email
    const userIds = Array.from(new Set(allTickets.map((t) => t.userId).filter(Boolean)));
    const userMap = new Map<string, { name?: string; email?: string }>();
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const u = await getDoc(doc(db, "users", uid));
          if (u.exists()) {
            const data: any = u.data();
            userMap.set(uid, {
              name: data?.displayName || data?.name || `${data?.firstName ?? ""} ${data?.lastName ?? ""}`.trim(),
              email: data?.email,
            });
          }
        } catch {}
      })
    );

    return allTickets.map((t) => {
      const meta = userMap.get(t.userId);
      return { ...t, attendeeName: meta?.name, attendeeEmail: meta?.email } as CheckinTicket;
    });
  } catch (e: any) {
    return rejectWithValue(e?.message ?? "Failed to fetch organizer tickets");
  }
});

// Optionally enrich tickets with event data for UI badges
export const enrichTicketWithEvent = async (ticket: CheckinTicket) => {
  try {
    const evDoc = await getDoc(doc(db, "events", ticket.eventId));
    if (evDoc.exists()) {
      const data: any = evDoc.data();
      return {
        ...ticket,
        eventTitle: data?.title,
      } as CheckinTicket & { eventTitle?: string };
    }
  } catch {}
  return ticket;
};

const checkinSlice = createSlice({
  name: "checkin",
  initialState,
  reducers: {
    clearCheckin(state) {
      state.tickets = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTicketsByEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketsByEvent.fulfilled, (state, action: PayloadAction<CheckinTicket[]>) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTicketsByEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Failed to load tickets";
      })
      .addCase(fetchTicketsByOrganizer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketsByOrganizer.fulfilled, (state, action: PayloadAction<CheckinTicket[]>) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTicketsByOrganizer.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Failed to load tickets";
      })
      .addCase(checkInTicket.pending, (state) => {
        state.error = null;
      })
      .addCase(checkInTicket.fulfilled, (state, action: PayloadAction<CheckinTicket>) => {
        const idx = state.tickets.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) {
          state.tickets[idx] = { ...state.tickets[idx], ...action.payload };
        } else {
          state.tickets.unshift(action.payload);
        }
      })
      .addCase(checkInTicket.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Failed to check-in ticket";
      });
  },
});

export const { clearCheckin } = checkinSlice.actions;
export default checkinSlice.reducer;
