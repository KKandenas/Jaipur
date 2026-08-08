import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { requireAuth } from "./app";

/**
 * Every device gets a stable anonymous UID (persisted by the Firebase SDK
 * across sessions via localStorage) which is all the engine needs to tell
 * the two players in a match apart - there's no account system to build.
 */
export function ensureSignedIn(): Promise<User> {
  return new Promise((resolve, reject) => {
    let auth;
    try {
      auth = requireAuth();
    } catch (error) {
      reject(error);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
        }
      },
      reject
    );
    if (!auth.currentUser) {
      signInAnonymously(auth).catch((error) => {
        unsubscribe();
        reject(error);
      });
    }
  });
}
