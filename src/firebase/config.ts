import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

export const FIREBASE_PROJECT_ID = "chapter-house-jm";

const firebaseConfig = {
  apiKey: "AIzaSyDsf4FPkdzWEkFzj9nRPF77LibZ0zA9i5M",
  authDomain: "chapter-house-jm.firebaseapp.com",
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: "chapter-house-jm.firebasestorage.app",
  messagingSenderId: "297946665119",
  appId: "1:297946665119:web:66d715a9556deef98292aa",
} as const;

/** Firebase web configuration identifies the project; it grants no admin access. */
export function chapterHouseFirebase(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}
