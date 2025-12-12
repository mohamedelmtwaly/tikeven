/** @format */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { OrganizerSettings } from "@/types/settings";

interface SettingsState {
  settings: OrganizerSettings | null;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: null,
  loading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk<
  OrganizerSettings | null,
  { userId: string }
>("settings/fetch", async ({ userId }, { rejectWithValue }) => {
  try {
    const ref = doc(db, "settings", userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        userId,
        defaultTicketQuantity: 100,
        defaultTicketPrice: 25,
        defaultVisibility: "public",
        emailNotifications: true,
        inAppAlerts: false,
      } as OrganizerSettings;
    }
    return { userId, ...(snap.data() as Partial<OrganizerSettings>) } as OrganizerSettings;
  } catch (error: any) {
    return rejectWithValue(error.message ?? "Failed to fetch settings");
  }
});

export const updateSettings = createAsyncThunk<
  OrganizerSettings,
  { userId: string; data: Partial<OrganizerSettings> }
>("settings/update", async ({ userId, data }, { rejectWithValue }) => {
  try {
    const ref = doc(db, "settings", userId);
    await setDoc(ref, data, { merge: true });
    return { userId, ...data } as OrganizerSettings;
  } catch (error: any) {
    return rejectWithValue(error.message ?? "Failed to update settings");
  }
});

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action: PayloadAction<OrganizerSettings | null>) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch settings";
      })
      .addCase(updateSettings.fulfilled, (state, action: PayloadAction<OrganizerSettings>) => {
        state.settings = {
          ...(state.settings ?? { userId: action.payload.userId }),
          ...action.payload,
        };
      });
  },
});

export default settingsSlice.reducer;
