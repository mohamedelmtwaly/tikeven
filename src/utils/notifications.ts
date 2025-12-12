import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebase/config";

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  link,
  relatedId,
}: {
  userId: string;
  type: 'event_published' | 'event_banned' | 'event_updated';
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
}) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const newNotificationRef = doc(notificationsRef);
    
    await setDoc(newNotificationRef, {
      id: newNotificationRef.id,
      userId,
      type,
      title,
      message,
      link: link || null,
      relatedId: relatedId || null,
      read: false,
      createdAt: serverTimestamp(),
    });
    
    return newNotificationRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};
