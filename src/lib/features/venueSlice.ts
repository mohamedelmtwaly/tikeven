import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  addVenue as addVenueFirebase,
  getVenues as getVenuesFirebase,
  getVenuesByOwner as getVenuesByOwnerFirebase,
  updateVenue as updateVenueFirebase,
  deleteVenue as deleteVenueFirebase,
  getVenueById as getVenueByIdFirebase,
} from "@/services/firebase/organizers/venues";

export interface Venue {
  id: string;
  title: string;
  address: string;
  city: string;
  country: string;
  description?: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
  capacity?: number;
  ownerUid?: string;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
}

interface VenueState {
  venues: Venue[];
  selectedVenue: Venue | null;
  loading: boolean;
  error: string | null;
}

const initialState: VenueState = {
  venues: [],
  selectedVenue: null,
  loading: false,
  error: null,
};

// =================== Thunks ===================

// Fetch venues (optionally by owner)
export const fetchVenues = createAsyncThunk(
  "venues/fetchVenues",
  async (ownerUid?: string) => {
    const data = ownerUid
      ? await getVenuesByOwnerFirebase(ownerUid)
      : await getVenuesFirebase();
    // Convert Firestore timestamps to ISO strings
    const safeData: Venue[] = (data as FirestoreVenueResult[]).map((v) => ({
      ...v,
      createdAt: normalizeTimestamp(v.createdAt),
      updatedAt: normalizeTimestamp(v.updatedAt),
    }));
    return safeData;
  }
);

// Add new venue
export const addVenueRedux = createAsyncThunk(
  "venues/addVenue",
  async (
    venueData: Omit<Venue, "id" | "createdAt" | "updatedAt">,
    thunkAPI
  ) => {
    const result = await addVenueFirebase(venueData);
    if (result.success) {
      // نضيف createdAt كـ ISO string للـ Redux
      return {
        id: result.id,
        ...venueData,
        createdAt: new Date().toISOString(),
      } as Venue;
    }
    return thunkAPI.rejectWithValue(result.message);
  }
);

// Update venue
export const updateVenueRedux = createAsyncThunk(
  "venues/updateVenue",
  async ({ id, data }: { id: string; data: Partial<Venue> }, thunkAPI) => {
    const result = await updateVenueFirebase(id, data);
    if (result.success) {
      const safeData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return { id, data: safeData };
    }
    return thunkAPI.rejectWithValue(result.message);
  }
);

// Delete venue
export const deleteVenueRedux = createAsyncThunk(
  "venues/deleteVenue",
  async (id: string, thunkAPI) => {
    const result = await deleteVenueFirebase(id);
    if (result.success) {
      return id;
    }
    return thunkAPI.rejectWithValue(result.message);
  }
);

// Get venue by id
type FirestoreTimestampLike =
  | { toDate?: () => { toISOString?: () => string } | undefined }
  | string
  | undefined;

type FirestoreVenueResult = Omit<Venue, "createdAt" | "updatedAt"> & {
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
};

const normalizeTimestamp = (
  value: FirestoreTimestampLike
): string | undefined => {
  if (typeof value === "string") return value;
  if (value && typeof value.toDate === "function") {
    const date = value.toDate();
    if (date && typeof date.toISOString === "function") {
      return date.toISOString();
    }
  }
  return undefined;
};

export const getVenueByIdRedux = createAsyncThunk(
  "venues/getVenueById",
  async (id: string, thunkAPI) => {
    const result = (await getVenueByIdFirebase(
      id
    )) as FirestoreVenueResult | null;
    if (result) {
      const safeResult: Venue = {
        ...result,
        createdAt: normalizeTimestamp(result.createdAt),
        updatedAt: normalizeTimestamp(result.updatedAt),
      };
      return safeResult;
    }
    return thunkAPI.rejectWithValue("Venue not found");
  }
);

// =================== Slice ===================

const venueSlice = createSlice({
  name: "venues",
  initialState,
  reducers: {
    setSelectedVenue: (state, action: PayloadAction<Venue | null>) => {
      state.selectedVenue = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchVenues
      .addCase(fetchVenues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVenues.fulfilled, (state, action) => {
        state.loading = false;
        state.venues = action.payload;
      })
      .addCase(fetchVenues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || null;
      })

      // addVenue
      .addCase(addVenueRedux.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addVenueRedux.fulfilled, (state, action) => {
        state.loading = false;
        state.venues.push(action.payload);
      })
      .addCase(addVenueRedux.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // updateVenue
      .addCase(updateVenueRedux.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVenueRedux.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.venues.findIndex((v) => v.id === action.payload.id);
        if (index !== -1) {
          state.venues[index] = {
            ...state.venues[index],
            ...action.payload.data,
          };
        }
      })
      .addCase(updateVenueRedux.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // deleteVenue
      .addCase(deleteVenueRedux.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVenueRedux.fulfilled, (state, action) => {
        state.loading = false;
        state.venues = state.venues.filter(
          (venue) => venue.id !== action.payload
        );
      })
      .addCase(deleteVenueRedux.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // getVenueById
      .addCase(getVenueByIdRedux.fulfilled, (state, action) => {
        state.selectedVenue = action.payload as Venue;
      });
  },
});

export const { setSelectedVenue } = venueSlice.actions;
export default venueSlice.reducer;
