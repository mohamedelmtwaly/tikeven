import { db } from "../config";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";

export const addVenue = async (venueData: {
  title: string;
  address: string;
  city: string;
  country: string;
  description?: string;
  image?: string;
  images?: string[];
  ownerUid?: string;
  latitude?: number;
  longitude?: number;
}) => {
  try {
    const docRef = await addDoc(collection(db, "venues"), {
      ...venueData,
      createdAt: serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding venue:", error);
    return { success: false, message: (error as Error).message };
  }
};

export const getVenues = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "venues"));
    const venues = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return venues;
  } catch (error) {
    console.error("Error fetching venues:", error);
    return [];
  }
};

export const getVenuesByOwner = async (ownerUid: string) => {
  try {
    const q = query(
      collection(db, "venues"),
      where("ownerUid", "==", ownerUid)
    );
    const querySnapshot = await getDocs(q);
    const venues = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return venues;
  } catch (error) {
    console.error("Error fetching venues by owner:", error);
    return [];
  }
};

export const updateVenue = async (
  id: string,
  updatedData: Partial<{
    title: string;
    address: string;
    city: string;
    country: string;
    description?: string;
    image?: string;
    images?: string[];
    latitude?: number;
    longitude?: number;
  }>
) => {
  try {
    const venueRef = doc(db, "venues", id);
    await updateDoc(venueRef, {
      ...updatedData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating venue:", error);
    return { success: false, message: (error as Error).message };
  }
};

export const deleteVenue = async (id: string) => {
  try {
    await deleteDoc(doc(db, "venues", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting venue:", error);
    return { success: false, message: (error as Error).message };
  }
};

export const getVenueById = async (id: string) => {
  try {
    const venueRef = doc(db, "venues", id);
    const venueSnap = await getDoc(venueRef);

    if (venueSnap.exists()) {
      return { id: venueSnap.id, ...venueSnap.data() };
    } else {
      console.warn("Venue not found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching venue:", error);
    return null;
  }
};
