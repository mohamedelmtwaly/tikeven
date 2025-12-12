import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase/config";

interface FirestorePathRef {
  _key?: { path?: { segments?: string[] } };
}

interface EventDoc {
  id: string;
  title?: string;
  category?: unknown;
  organizer?: { id?: string } | FirestorePathRef | null;
  organizerId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

interface OrderDoc {
  id: string;
  eventId?: string;
  status?: string;
  quantity?: number | string;
  totalPrice?: number | string;
  checkedIn?: boolean;
  checkedInAt?: string | Date;
}

interface Ticket {
  id: string;
  orderId: string;
  eventId: string;
  checkedIn: boolean;
}

interface EventBase {
  id: string;
  title?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  category: string;
}

interface TopSellingEvent extends EventBase {
  ticketsCount: number;
}

interface UpcomingEvent extends EventBase {
  startDate: string | Date;
  endDate: string | Date;
}

interface AnalyticsPayload {
  revenueByCategory: Record<string, number>;
  totalTickets: number;
  totalEvents: number;
  topSellingEvents: TopSellingEvent[];
  upcomingEvents: UpcomingEvent[];
  totalCheckIns: number;
  attendanceRate: number;
  attendanceByCategory: Record<string, number>;
}

export const fetchOrganizerAnalytics = createAsyncThunk<
  AnalyticsPayload,
  string,
  { rejectValue: string }
>(
  "analytics/fetchOrganizer",
  async (organizerId, { rejectWithValue }) => {
    try {
      // 1. Get all events by this organizer
      const eventsSnapshot = await getDocs(collection(db, "events"));

      const events: EventDoc[] = [];
      eventsSnapshot.forEach((doc) =>
        events.push({ id: doc.id, ...(doc.data() as Record<string, unknown>) })
      );

      // Support both organizer reference and string id
      const filteredEvents = events.filter((e) => {
        let idFromRef: string | undefined;
        const org = e.organizer;
        if (org && typeof org === "object") {
          if ("id" in org && typeof (org as { id?: unknown }).id === "string") {
            idFromRef = (org as { id?: string }).id;
          }
        }
        if (!idFromRef) idFromRef = e.organizerId;
        return idFromRef === organizerId;
      });

      // 2. Calculate revenue per category, total tickets, and check-ins using CONFIRMED orders
      const revenueByCategory: Record<string, number> = {};
      let totalTickets = 0;
      let totalCheckIns = 0;

      const extractId = (value: unknown): string => {
        if (value == null) return "Other";
        if (typeof value === "object") {
          if ("_key" in value) {
            const ref = value as FirestorePathRef;
            const segs = ref._key?.path?.segments;
            if (segs && segs.length) {
              return segs[segs.length - 1];
            }
          }
          if ("id" in value) {
            const maybeId = (value as { id?: unknown }).id;
            if (typeof maybeId === "string") return maybeId;
          }
        }
        if (typeof value === "string") return value;
        return "Other";
      };

      // Build a quick lookup for event -> category id
      const eventCategory: Record<string, string> = {};
      filteredEvents.forEach((ev: EventDoc) => {
        eventCategory[ev.id] = extractId(ev.category);
      });

      // Fetch all orders and filter to this organizer's events
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const eventIds = new Set(filteredEvents.map((e) => e.id));

      const perEventSold: Record<string, number> = {};
      // Create a mapping for tickets by order ID
      const ticketsByOrder: Record<string, Ticket[]> = {};
      // First, process all orders to get basic analytics
      for (const doc of ordersSnapshot.docs) {
        const o: OrderDoc = { id: doc.id, ...(doc.data() as Record<string, unknown>) };
        if (!eventIds.has(o.eventId || "")) continue;
        if (o.status !== "confirmed") continue;

        const catId = eventCategory[o.eventId!] || "Other";
        const qty = Number(o.quantity) || 0;
        const orderRevenue = Number(o.totalPrice) || 0;

        // Fetch tickets for this order
        try {
          const ticketsRef = collection(db, "tickets");
          const q = query(ticketsRef, where("orderId", "==", doc.id));
          const ticketsSnapshot = await getDocs(q);

          const tickets = ticketsSnapshot.docs.map((ticket) => ({
            id: ticket.id,
            ...ticket.data(),
          }) as Ticket);
          ticketsByOrder[doc.id] = tickets;
          const checkedInTickets = tickets.filter(ticket => ticket.checkedIn).length;
          totalCheckIns += checkedInTickets;
        } catch (error) {
          console.error(`Error fetching tickets for order ${doc.id}:`, error);
        }

        // Aggregate by category
        revenueByCategory[catId] = (revenueByCategory[catId] || 0) + orderRevenue;
        // Total tickets
        totalTickets += qty;
        // Track per-event sold for top list
        if (o.eventId) {
          perEventSold[o.eventId] = (perEventSold[o.eventId] || 0) + qty;
        }
      }

      // 3. Get top selling events
      const topSellingEvents = [...filteredEvents]
        .map((e) => ({
          id: e.id,
          title: e.title,
          ticketsCount: perEventSold[e.id] || 0,
          category: extractId(e.category),
        }))
        .sort((a, b) => (b.ticketsCount || 0) - (a.ticketsCount || 0))
        .slice(0, 5);

      // 4. Get all upcoming events
      const now = new Date();
      const upcomingEvents = filteredEvents
        .filter((e) => {
          const startDate = e.startDate ? new Date(e.startDate as string) : null;
          return startDate && startDate > now;
        })
        .map((e) => ({
          id: e.id,
          title: e.title || 'Untitled Event',
          startDate: e.startDate as string,
          endDate: e.endDate as string,
          category: extractId(e.category),
        }))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 5);

      // Calculate attendance rate (check-ins / tickets sold), avoid division by zero
      const attendanceRate = totalTickets > 0 ? (totalCheckIns / totalTickets) * 100 : 0;

      // Calculate attendance by category
      const attendanceByCategory: Record<string, number> = {};
      for (const doc of ordersSnapshot.docs) {
        const o: OrderDoc = { id: doc.id, ...(doc.data() as Record<string, unknown>) };
        if (!eventIds.has(o.eventId || "")) continue;
        if (o.status !== "confirmed") continue;

        const catId = eventCategory[o.eventId!] || "Other";
        try {
          const ticketsRef = collection(db, "tickets");
          const q = query(ticketsRef, where("orderId", "==", doc.id));
          const ticketsSnapshot = await getDocs(q);

          const tickets = ticketsSnapshot.docs.map((ticket) => ({
            id: ticket.id,
            ...ticket.data(),
          }) as Ticket);
          const checkedInTickets = tickets.filter(ticket => ticket.checkedIn).length;
          attendanceByCategory[catId] = (attendanceByCategory[catId] || 0) + checkedInTickets;
        } catch (error) {
          console.error(`Error fetching tickets for order ${doc.id}:`, error);
        }
      }

      return { 
        revenueByCategory, 
        totalTickets, 
        totalEvents: filteredEvents.length, 
        topSellingEvents,
        upcomingEvents,
        totalCheckIns,
        attendanceRate: parseFloat(attendanceRate.toFixed(1)), // Round to 1 decimal place
        attendanceByCategory,
      };
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : String(err));
    }
  }
);

interface AnalyticsState {
  revenueByCategory: Record<string, number>;
  totalTickets: number;
  totalEvents: number;
  topSellingEvents: TopSellingEvent[];
  upcomingEvents: UpcomingEvent[];
  totalCheckIns: number;
  attendanceRate: number;
  attendanceByCategory: Record<string, number>;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  revenueByCategory: {},
  totalTickets: 0,
  totalEvents: 0,
  topSellingEvents: [],
  upcomingEvents: [],
  totalCheckIns: 0,
  attendanceRate: 0,
  attendanceByCategory: {},
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizerAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrganizerAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueByCategory = action.payload.revenueByCategory;
        state.totalTickets = action.payload.totalTickets;
        state.totalEvents = action.payload.totalEvents;
        state.topSellingEvents = action.payload.topSellingEvents;
        state.upcomingEvents = action.payload.upcomingEvents;
        state.totalCheckIns = action.payload.totalCheckIns;
        state.attendanceRate = action.payload.attendanceRate;
        state.attendanceByCategory = action.payload.attendanceByCategory || {};
      })
      .addCase(fetchOrganizerAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch analytics';
      });
  },
});

export default analyticsSlice.reducer;