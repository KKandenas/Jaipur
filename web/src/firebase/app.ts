import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigured } from "./config";

/**
 * Firebase's own SDK throws synchronously (e.g. `auth/invalid-api-key`) the
 * moment `getAuth()`/`getFirestore()` see a missing/malformed config - and
 * since this module is imported at the top of the dependency graph, that
 * throw would happen during module evaluation, before `main.ts` gets a
 * chance to run at all, producing a silent blank page. Guard it instead, so
 * an unconfigured deploy shows the app's normal "sign-in failed" messaging.
 */
export const firebaseReady = isFirebaseConfigured();

let firebaseApp: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (firebaseReady) {
  firebaseApp = initializeApp(firebaseConfig);
  authInstance = getAuth(firebaseApp);
  dbInstance = getFirestore(firebaseApp);
}

const NOT_CONFIGURED_MESSAGE =
  "Firebase isn't configured yet. Copy web/.env.example to web/.env (or set the VITE_FIREBASE_* build variables) with your Firebase project's web config.";

export function requireAuth(): Auth {
  if (!authInstance) throw new Error(NOT_CONFIGURED_MESSAGE);
  return authInstance;
}

export function requireDb(): Firestore {
  if (!dbInstance) throw new Error(NOT_CONFIGURED_MESSAGE);
  return dbInstance;
}
