import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  UserCredential,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, DocumentData, FirestoreError } from "firebase/firestore";
import { app, db } from "../config";


export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: string;
  image: string;
}


export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: string,
  image: string
): Promise<{ success: boolean; message?: string; user?: AppUser }> => {
  try {
    const auth = getAuth(app);
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const storedUser = await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      role,
      image,
      createdAt: new Date(),
    });
    console.log(storedUser);

    return { success: true, user: {
      uid: user.uid,
      name: name ?? "",
      email: email ?? "",
      role: role ?? "user",
      image: image ?? "",
    } };
  } catch (error: unknown) {
    const err = error as FirestoreError;
    console.error(" Firebase Register Error:", err.message);
    return { success: false, message: err.message };
  }
};


export const loginUser = async (
  email: string,
  password: string
): Promise<{
  success: boolean;
  message?: string;
  user?: AppUser;
}> => {
  try {
    const auth = getAuth(app);
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      return { success: false, message: "User data not found in Firestore" };
    }

    const userData = userDoc.data() as DocumentData;

    const appUser: AppUser = {
      uid: user.uid,
      name: userData.name ?? "",
      email: userData.email ?? "",
      role: userData.role ?? "user",
      image: userData.image ?? "",
    };

    return { success: true, user: appUser };
  } catch (error: unknown) {
    const err = error as FirestoreError;
    console.error(" Firebase Auth Login Error:", err.message);
    return { success: false, message: err.message };
  }
};


export const sendResetEmail = async (email: string): Promise<boolean> => {
  try {
    const auth = getAuth(app);
    await sendPasswordResetEmail(auth, email, {
      url: "http://localhost:3000/",
      handleCodeInApp: true,
    });
    return true;
  } catch (error) {
    console.error("Password Reset Error:", error);
    return false;
  }
};

export const verifyResetCode = async (oobCode: string): Promise<string> => {
  const auth = getAuth(app);
  return await verifyPasswordResetCode(auth, oobCode);
};

export const confirmNewPassword = async (oobCode: string, newPassword: string): Promise<boolean> => {
  const auth = getAuth(app);
  await confirmPasswordReset(auth, oobCode, newPassword);
  return true;
};







export const logoutUser = async () => {
  const auth = getAuth();
  try {
    await signOut(auth);
    return true; 
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};
