import type { FirebaseOptions } from "firebase/app";

/**
 * Firebase web config isn't a secret the way an API key for a server usually
 * is - it just identifies which Firebase project to talk to. Real access
 * control lives entirely in firestore.rules. Even so, we don't hardcode a
 * project's values in source: they're injected at build time via Vite env
 * vars (see `.env.example`), so this repo works against whatever Firebase
 * project you point it at without editing code.
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}
