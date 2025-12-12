/** @format */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import User from "@/types/user";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/services/firebase/config";
import {
  getAuth,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

//
// 🔹 Fetch all users
//
export const fetchUsers = createAsyncThunk(
  "users/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const users: User[] = snapshot.docs.map((docItem) => {
        const data = docItem.data();
        const createdAt = data.createdAt?.toDate?.().toISOString?.() || null;
        const updatedAt = data.updatedAt?.toDate?.().toISOString?.() || null;

        return {
          id: docItem.id,
          ...data,
          createdAt,
          updatedAt,
        } as User;
      });

      return users;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch single user by ID (fallback for profile pages)
export const fetchUserById = createAsyncThunk(
  "users/fetchById",
  async (userId: string, { rejectWithValue }) => {
    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        return rejectWithValue("User not found");
      }
      const data = snap.data() as any;
      const createdAt = data?.createdAt?.toDate?.()?.toISOString?.() ?? data?.createdAt ?? null;
      const updatedAt = data?.updatedAt?.toDate?.()?.toISOString?.() ?? data?.updatedAt ?? null;

      const user: User = {
        id: userId,
        email: data?.email ?? "",
        name: data?.name ?? data?.displayName ?? "",
        image: data?.image ?? "",
        role: data?.role ?? "user",
        blocked: data?.blocked ?? false,
        gender: data?.gender,
        age: data?.age,
        country: data?.country,
        city: data?.city,
        createdAt,
        updatedAt,
      } as User;
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateOrganizer = createAsyncThunk(
  "users/updateOrganizer",
  async (
    { userId, data }: { userId: string; data: Partial<User> },
    { rejectWithValue }
  ) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, data as any);
      return { userId, data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleBlockUser = createAsyncThunk(
  "users/toggleBlock",
  async (
    { userId, currentStatus }: { userId: string; currentStatus: boolean },
    { rejectWithValue }
  ) => {
    try {
      const userRef = doc(db, "users", userId);
      const newStatus = !currentStatus;
      await updateDoc(userRef, { blocked: newStatus });
      return { userId, newStatus };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
};

export const fetchUserFromFirebase = createAsyncThunk<User | null>(
  "users/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const auth = getAuth();
      return await new Promise<User | null>((resolve) => {
        onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            // get Firestore user doc for extra info (role, blocked, image)
            const userRef = doc(db, "users", firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            const firestoreData = userSnap.exists() ? userSnap.data() : {};
            // Normalize timestamps to ISO strings to keep Redux state serializable
            const createdAt =
              (firestoreData as any)?.createdAt?.toDate?.()?.toISOString?.() ??
              (firestoreData as any)?.createdAt ??
              null;
            const updatedAt =
              (firestoreData as any)?.updatedAt?.toDate?.()?.toISOString?.() ??
              (firestoreData as any)?.updatedAt ??
              null;

            const userData: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email ?? "",
              name:
                (firestoreData as any)?.name ?? firebaseUser.displayName ?? "",
              image: firestoreData?.image ?? firebaseUser.photoURL ?? "",
              role: firestoreData?.role ?? "user",
              blocked: firestoreData?.blocked ?? false,
              gender: (firestoreData as any)?.gender,
              age: (firestoreData as any)?.age,
              country: (firestoreData as any)?.country,
              city: (firestoreData as any)?.city,
              createdAt,
              updatedAt,
            };

            localStorage.setItem("user", JSON.stringify(userData));
            resolve(userData);
          } else {
            localStorage.removeItem("user");
            resolve(null);
          }
        });
      });
    } catch (error) {
      return rejectWithValue("Failed to fetch user from Firebase");
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState: {
    users: [] as User[],
    currentUser: getStoredUser() as User | null,
    loading: true,
  },
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.currentUser = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    logout(state) {
      state.currentUser = null;
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserById.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx >= 0) state.users[idx] = action.payload;
        else state.users.push(action.payload);
      })
      .addCase(fetchUserById.rejected, (state) => {
        state.loading = false;
      })
      .addCase(toggleBlockUser.fulfilled, (state, action) => {
        const { userId, newStatus } = action.payload;
        const user = state.users.find((u) => u.id === userId);
        if (user) user.blocked = newStatus;
      })
      .addCase(updateOrganizer.fulfilled, (state, action) => {
        const { userId, data } = action.payload as {
          userId: string;
          data: Partial<User>;
        };
        if (state.currentUser && state.currentUser.id === userId) {
          state.currentUser = { ...state.currentUser, ...data } as User;
          localStorage.setItem("user", JSON.stringify(state.currentUser));
        }
      })
      .addCase(fetchUserFromFirebase.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserFromFirebase.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserFromFirebase.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setUser, logout } = userSlice.actions;

export const selectCurrentUser = (state: { users: { currentUser: User | null } }) => 
  state.users.currentUser;

export const selectIsAuthenticated = (state: { users: { currentUser: User | null } }) => 
  !!state.users.currentUser;

export default userSlice.reducer;

let userUnsubscribe: (() => void) | null = null;

export const startUserRealtimeListener = createAsyncThunk(
  "users/startUserRealtimeListener",
  async (_, { dispatch, rejectWithValue, getState }) => {
    try {
      const auth = getAuth();
      const setup = (uid: string) => {
        if (userUnsubscribe) {
          userUnsubscribe();
          userUnsubscribe = null;
        }
        const userRef = doc(db, "users", uid);
        userUnsubscribe = onSnapshot(userRef, (snap) => {
          if (!snap.exists()) return;
          const data = snap.data() as Partial<User>;
          const state: any = getState();
          const prev: User | null = state?.users?.currentUser ?? null;
          const email =
            (data as any)?.email ??
            auth.currentUser?.email ??
            prev?.email ??
            "";
          const merged: User = {
            id: uid,
            email,
            role: (data as any)?.role ?? prev?.role ?? "user",
            blocked: (data as any)?.blocked ?? prev?.blocked ?? false,
            name: data?.name ?? prev?.name ?? "",
            image: data?.image ?? prev?.image ?? "",
            gender: (data as any)?.gender ?? prev?.gender,
            age: (data as any)?.age ?? prev?.age,
            country: (data as any)?.country ?? prev?.country,
            city: (data as any)?.city ?? prev?.city,
            createdAt: (prev as any)?.createdAt ?? undefined,
            updatedAt: (prev as any)?.updatedAt ?? undefined,
          } as User;
          dispatch(setUser(merged));
        });
      };

      const u = auth.currentUser;
      if (u?.uid) {
        setup(u.uid);
      } else {
        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser?.uid) {
            setup(firebaseUser.uid);
            unsub();
          }
        });
      }
    } catch (error: any) {
      return rejectWithValue(
        error.message ?? "Failed to start realtime listener"
      );
    }
  }
);
