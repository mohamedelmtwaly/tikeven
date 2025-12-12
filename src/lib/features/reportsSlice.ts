import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase/config";

export interface Report {
  id?: string;
  eventId: string;
  organizerId?: string;
  reporterId?: string;
  type: string;
  message: string;
  createdAt?: string;
}

interface ReportsState {
  creating: boolean;
  loading: boolean;
  error: string | null;
  items: Report[];
}

const initialState: ReportsState = {
  creating: false,
  loading: false,
  error: null,
  items: [],
};

export const createReport = createAsyncThunk<
  { id: string },
  Omit<Report, "id" | "createdAt">,
  { rejectValue: string }
>("reports/createReport", async (payload, thunkApi) => {
  try {
    const docRef = await addDoc(collection(db, "reports"), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id };
  } catch (err: any) {
    console.error("Failed to create report:", err);
    return thunkApi.rejectWithValue(err?.message || "Failed to create report");
  }
});

interface FetchReportsParams {
  eventId?: string;
}

export const fetchReports = createAsyncThunk<
  Report[],
  FetchReportsParams | undefined,
  { rejectValue: string }
>("reports/fetchReports", async (params, thunkApi) => {
  try {
    let queryRef = collection(db, "reports") as any;
    
    // If eventId is provided, filter by eventId
    if (params?.eventId) {
      queryRef = query(collection(db, "reports"), where("eventId", "==", params.eventId));
    }
    
    const snapshot = await getDocs(queryRef);

    const reports: Report[] = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data() as any;
      const createdAtValue = data.createdAt;
      const createdAt = createdAtValue?.toDate
        ? createdAtValue.toDate().toISOString()
        : createdAtValue || undefined;

      return {
        id: docSnapshot.id,
        eventId: data.eventId,
        organizerId: data.organizerId,
        reporterId: data.reporterId,
        type: data.type,
        message: data.message,
        createdAt,
      } as Report;
    });

    return reports;
  } catch (err: any) {
    console.error("Failed to fetch reports:", err);
    return thunkApi.rejectWithValue(err?.message || "Failed to fetch reports");
  }
});

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createReport.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createReport.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createReport.rejected, (state, action: PayloadAction<any>) => {
        state.creating = false;
        state.error = (action.payload as string) || "Unknown error";
      })
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action: PayloadAction<Report[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = (action.payload as string) || "Unknown error";
      });
  },
});

export default reportsSlice.reducer;
