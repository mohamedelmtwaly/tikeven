/** @format */

"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/features";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  fetchUserFromFirebase,
  startUserRealtimeListener,
} from "@/lib/features/userSlice";

function InitApp({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    // fetch current user once and start realtime listener so the app stays in sync
    dispatch(fetchUserFromFirebase() as any);
    dispatch(startUserRealtimeListener() as any);
  }, [dispatch]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <InitApp>{children}</InitApp>
    </Provider>
  );
}
