import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase/config";
import User from "@/types/user";

export const fetchOrganizers = async (): Promise<User[]> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "organizer"));
    const snapshot = await getDocs(q);

    const organizers: User[] = snapshot.docs.map((docItem) => {
      const data = docItem.data();
      return {
        id: docItem.id,
        ...data,
      } as User;
    });

    return organizers;
  } catch (error) {
    console.error("Error fetching organizers:", error);
    return [];
  }
};
