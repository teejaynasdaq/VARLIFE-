import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { initializeAuth, getAuth, Auth } from "firebase/auth";
// @ts-ignore — RN persistence export is present at runtime in firebase/auth
import { getReactNativePersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function looksLikePlaceholder(value?: string): boolean {
  if (!value || !value.trim()) return true;
  const v = value.toLowerCase();
  return (
    v.includes("abcd") ||
    v.includes("your_") ||
    v.includes("your-") ||
    v.includes("placeholder") ||
    v.includes("xxx") ||
    v === "undefined"
  );
}

export function getFirebaseConfigErrors(): string[] {
  const errors: string[] = [];
  if (looksLikePlaceholder(firebaseConfig.apiKey)) {
    errors.push("EXPO_PUBLIC_FIREBASE_API_KEY is missing or a placeholder");
  }
  if (looksLikePlaceholder(firebaseConfig.projectId)) {
    errors.push("EXPO_PUBLIC_FIREBASE_PROJECT_ID is missing or a placeholder");
  }
  if (looksLikePlaceholder(firebaseConfig.appId)) {
    errors.push(
      "EXPO_PUBLIC_FIREBASE_APP_ID is missing or a placeholder — copy the Web appId from Firebase Console → Project settings → Your apps",
    );
  }
  if (looksLikePlaceholder(firebaseConfig.messagingSenderId)) {
    errors.push("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is missing or a placeholder");
  }
  return errors;
}

export const isFirebaseConfigured = getFirebaseConfigErrors().length === 0;

if (!isFirebaseConfigured && __DEV__) {
  console.warn(
    "[Firebase] Config incomplete:\n- " + getFirebaseConfigErrors().join("\n- "),
  );
}

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage, firebaseConfig };
