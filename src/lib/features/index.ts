import { configureStore } from "@reduxjs/toolkit";
import { eventsReducer } from "../events/eventSlice";
import categoriesSlice from "./categorySlice";
import userSlice from "./userSlice";
import orderSlice from "./orderSlice";
import eventsSlice from "./eventSlice";
import venuesSlice from "./venueSlice";
import analyticsSlice from "./analyticsSlice";
import checkinSlice from "./checkinSlice";
import settingsSlice from "./settingsSlice";
import reportsSlice from "./reportsSlice";

export const store = configureStore({
  reducer: {
    categories: categoriesSlice,
    users: userSlice,
    orders: orderSlice,
    events: eventsSlice,
    venues: venuesSlice,
    analytics: analyticsSlice,
    checkin: checkinSlice,
    settings: settingsSlice,
    reports: reportsSlice,
    eventsInfo: eventsReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
