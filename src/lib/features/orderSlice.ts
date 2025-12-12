import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  collection,
  addDoc,
  getDocs,
  getFirestore,
  writeBatch,
  getDoc,
  doc,
  query,
  where,
  setDoc,
  orderBy,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/services/firebase/config";

export interface Review {
  id?: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  userName?: string;
  userAvatar?: string;
}

export interface TicketOrder {
  id: string;
  eventId: string;
  userId: string;
  quantity: number;
  eventName: string;
  totalPrice: number;
  userEmail: string;
  eventDate: string;
  eventLocation?: string;
  price: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt?: string;
  review?: Review;
  eventData?: {
    id: string;
    title: string;
    image: string;
    date: string | null;
    category?: string;
  };
  tickets?: Ticket[];
  isUpcoming?: boolean;
  category?: string;
}

export interface Ticket {
  id?: string;
  orderId: string;
  eventId: string;
  userId: string;
  ticketNumber: string;
  qrCodeUrl?: string;
  createdAt: string;
}

const generateTicketNumber = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 100000–999999
};

export const updateOrderReview = createAsyncThunk<
  { orderId: string; review: Review },
  { orderId: string; eventId: string; review: Omit<Review, 'id' | 'createdAt'> },
  { rejectValue: string; state: { orders: { orders: TicketOrder[] } } }
>("orders/updateReview", async ({ orderId, eventId, review }, { rejectWithValue, getState }) => {
  try {
    const db = getFirestore();
    const batch = writeBatch(db);
    const orderRef = doc(db, "orders", orderId);
    const reviewsRef = collection(db, "reviews");
    const reviewId = doc(reviewsRef).id;
    const reviewData = {
      ...review,
      id: reviewId,
      orderId,
      eventId,
      createdAt: new Date().toISOString()
    };

    // Update the order document with the review
    batch.update(orderRef, { 
      review: reviewData 
    });

    // Create a new document in the reviews collection
    const newReviewRef = doc(db, "reviews", reviewId);
    batch.set(newReviewRef, reviewData);

    // Commit the batch
    await batch.commit();

    return { orderId, review: reviewData };
  } catch (error: unknown) {
    console.error('Error in updateOrderReview:', error);
    if (error instanceof Error) return rejectWithValue(error.message);
    return rejectWithValue("Failed to update order review");
  }
});

export const fetchOrders = createAsyncThunk<
  TicketOrder[],
  string | void,
  { rejectValue: string }
>("orders/fetchAll", async (userId, { rejectWithValue }) => {
  try {
    // --- 1️⃣ Get orders (optionally filtered by user) ---
    const baseCollection = collection(db, "orders");

    const ordersQuery = userId
      ? query(
          baseCollection,
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        )
      : query(baseCollection, orderBy("createdAt", "desc"));

    const snapshot = await getDocs(ordersQuery);

    const orders: TicketOrder[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as TicketOrder[];

    // --- 2️⃣ Fetch tickets + event for each order ---
    const ordersWithExtras = await Promise.all(
      orders.map(async (order) => {
        // --- Get tickets ---
        const ticketsSnapshot = await getDocs(
          query(collection(db, "tickets"), where("orderId", "==", order.id))
        );
        let tickets: Ticket[] = ticketsSnapshot.docs.map((tDoc) => ({
          id: tDoc.id,
          ...tDoc.data(),
        })) as Ticket[];

        let eventData: TicketOrder["eventData"] = undefined;
        let isUpcoming = false;

        try {
          if (order.eventId) {
            const eventDoc = await getDoc(doc(db, "events", order.eventId));
            if (eventDoc.exists()) {
              const event = eventDoc.data();

              // ✅ FIXED syntax here
              const eventDate =
                event.startDate instanceof Date
                  ? event.startDate
                  : event.startDate?.toDate
                  ? event.startDate.toDate()
                  : new Date(event.startDate); // handle Firestore Timestamp or string

              // Get category name if categoryId exists
              let categoryName = 'uncategorized';
              if (event.category) {
                try {
                  const categoryDoc = await getDoc(doc(db, 'categories', event.category));
                  if (categoryDoc.exists()) {
                    categoryName = categoryDoc.data()?.name || 'uncategorized';
                  }
                } catch (err) {
                  console.warn('Error fetching category:', err);
                }
              } else if (event.category) {
                // Fallback to direct category name if categoryId doesn't exist
                categoryName = event.category;
              }

              eventData = {
                id: eventDoc.id,
                title: event.title,
                image: event.images?.[0] || "",
                date: eventDate?.toISOString?.(),
                category: categoryName,
              };

              // --- Determine if upcoming ---
              isUpcoming = eventDate > new Date();
            }
          }
        } catch (err) {
          console.warn("Error fetching event for order:", order.id, err);
        }

        return {
          ...order,
          createdAt:
            // Firestore Timestamp -> ISO string
            (order as any)?.createdAt?.toDate?.()?.toISOString?.() ??
            // already a string
            (typeof (order as any)?.createdAt === "string"
              ? ((order as any).createdAt as string)
              : undefined),
          tickets,
          eventData,
          isUpcoming,
          category: eventData?.category || 'uncategorized',
        };
      })
    );

    return ordersWithExtras;
  } catch (error: unknown) {
    if (error instanceof Error) return rejectWithValue(error.message);
    return rejectWithValue("Failed to fetch orders with tickets and events.");
  }
});

export const createOrderWithTickets = createAsyncThunk<
  TicketOrder & { tickets: Ticket[] },
  Omit<TicketOrder, "id" | "createdAt" | "status"> & {
    userEmail: string;
    eventName: string;
    eventDate: string;
    eventLocation?: string;
  },
  { rejectValue: string }
>("orders/createWithTickets", async (orderData, { rejectWithValue }) => {
  try {
    const newOrder: Omit<TicketOrder, "id"> = {
      ...orderData,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Step 1: create order
    const orderRef = await addDoc(collection(db, "orders"), newOrder);


    const tickets: Ticket[] = [];
    for (let i = 0; i < orderData.quantity; i++) {
      const ticket: Omit<Ticket, "id"> = {
        orderId: orderRef.id,
        eventId: orderData.eventId,
        userId: orderData.userId,
        ticketNumber: generateTicketNumber(),
        createdAt: new Date().toISOString(),
      };

      const ticketRef = await addDoc(collection(db, "tickets"), ticket);
      const fullTicket: Ticket = { id: ticketRef.id, ...ticket };
      tickets.push(fullTicket);
    }

    return {
      id: orderRef.id,
      ...newOrder,
      tickets,
    };
  } catch (error: unknown) {
    if (error instanceof Error) return rejectWithValue(error.message);
    return rejectWithValue("Failed to create order with tickets.");
  }
});

export const fetchOrderById = createAsyncThunk<
  TicketOrder & { tickets?: Ticket[]; eventData?: TicketOrder["eventData"] },
  string,
  { rejectValue: string }
>("orders/fetchById", async (orderId, { rejectWithValue }) => {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    if (!orderDoc.exists()) throw new Error("Order not found");

    const orderData = { id: orderDoc.id, ...orderDoc.data() } as TicketOrder;

    const ticketsSnapshot = await getDocs(
      query(collection(db, "tickets"), where("orderId", "==", orderId))
    );

    const tickets: Ticket[] = ticketsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Ticket[];

    let eventData: TicketOrder["eventData"] = undefined;
    if (orderData.eventId) {
      const eventDoc = await getDoc(doc(db, "events", orderData.eventId));
      if (eventDoc.exists()) {
        const data = eventDoc.data();

        const startDate =
          data.startDate instanceof Date
            ? data.startDate
            : data.startDate?.toDate
            ? data.startDate.toDate()
            : new Date(data.startDate);

        eventData = {
          id: eventDoc.id,
          title: data.title,
          image: data.images?.[0] || "",
          date: startDate?.toISOString?.(),
        };
      }
    }

    // ✅ Return everything together
    return { ...orderData, tickets, eventData };
  } catch (error: unknown) {
    if (error instanceof Error) return rejectWithValue(error.message);
    return rejectWithValue("Failed to fetch order by ID.");
  }
});
// Checkout a single order (mark as confirmed)
export const checkoutOrder = createAsyncThunk<
  TicketOrder,
  { orderId: string },
  { rejectValue: string }
>("orders/checkout", async ({ orderId }, { rejectWithValue }) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return rejectWithValue("Order not found");
    }

    const orderData = {
      ...orderSnap.data(),
      status: "confirmed",
    } as TicketOrder & {
      userEmail?: string;
      eventDate?: string;
      eventLocation?: string;
    };

    // ✅ Update order status in Firestore
    await setDoc(orderRef, orderData, { merge: true });

    // ✅ Create transaction record
    await addDoc(collection(db, "transactions"), {
      orderId: orderSnap.id,
      userId: orderData.userId,
      totalPrice: orderData.totalPrice,
      status: "success",
      createdAt: new Date().toISOString(),
    });

    const ticketsSnapshot = await getDocs(
      query(collection(db, "tickets"), where("orderId", "==", orderId))
    );

    const tickets = ticketsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Ticket[];

    for (const ticket of tickets) {
      await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: (orderData as TicketOrder).userEmail,
          eventName: orderData.eventName,
          eventDate: (orderData as TicketOrder).eventDate,
          eventLocation: (orderData as TicketOrder).eventLocation,
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          orderId,
          userId: orderData.userId,
          eventId: orderData.eventId,
        }),
      });
    }

    return orderData;
  } catch (error: unknown) {
    if (error instanceof Error) return rejectWithValue(error.message);
    return rejectWithValue("Failed to checkout order");
  }
});

const orderTicketSlice = createSlice({
  name: "orders",
  initialState: {
    orders: [] as TicketOrder[],
    loading: true,
    reviewStatus: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
    confirming: false,
    error: null as string | null,
    order: null as (TicketOrder & { tickets?: Ticket[]; eventData?: TicketOrder["eventData"] }) | null,
  },
  reducers: {
    updateStatus(
      state,
      action: PayloadAction<{ id: string; status: TicketOrder["status"] }>
    ) {
      const order = state.orders.find((o) => o.id === action.payload.id);
      if (order) order.status = action.payload.status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
        state.loading = false;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch orders";
      })
      .addCase(createOrderWithTickets.pending, (state) => {
        state.loading = true;
      })
      .addCase(createOrderWithTickets.fulfilled, (state, action) => {
        state.orders = [action.payload, ...state.orders];
        state.loading = false;
      })
      .addCase(createOrderWithTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create order";
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.order = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(checkoutOrder.pending, (state) => {
        state.confirming = true;
      })
      .addCase(checkoutOrder.fulfilled, (state, action) => {
        state.confirming = false;
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) state.orders[index] = action.payload;
      })
      .addCase(checkoutOrder.rejected, (state, action) => {
        state.confirming = false;
        state.error = action.payload as string;
      })
      .addCase(updateOrderReview.pending, (state) => {
        state.reviewStatus = 'loading';
      })
      .addCase(updateOrderReview.fulfilled, (state, action) => {
        state.reviewStatus = 'succeeded';
        const { orderId, review } = action.payload;
        const orderIndex = state.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].review = review;
        }
        if (state.order?.id === orderId) {
          state.order.review = review;
        }
      })
      .addCase(updateOrderReview.rejected, (state, action) => {
        state.reviewStatus = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { updateStatus } = orderTicketSlice.actions;
export default orderTicketSlice.reducer;
