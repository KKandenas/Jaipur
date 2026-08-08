import { observeGame } from "./firebase/gameService";
import { clearSelections, setState, state } from "./state";

let unsubscribe: (() => void) | null = null;
let subscribedCode: string | null = null;

/**
 * Keeps the Firestore listener in sync with `state.gameCode`. Cheap to call
 * repeatedly (e.g. on every render tick) - it only does work when the code
 * actually changed since the last call.
 */
export function syncGameSubscription(): void {
  if (state.gameCode === subscribedCode) return;

  unsubscribe?.();
  unsubscribe = null;
  subscribedCode = state.gameCode;

  if (!state.gameCode) {
    setState({ gameDoc: null });
    return;
  }

  try {
    unsubscribe = observeGame(state.gameCode, (doc) => {
      setState({ gameDoc: doc });
      if (doc.state && doc.state.currentPlayerID !== state.uid) {
        clearSelections();
      }
    });
  } catch (error) {
    // Most likely Firebase isn't configured (see firebase/app.ts). Surface it
    // as a normal game error instead of letting it crash the render loop -
    // this path can be reached on load if a stale game code from a previous
    // session is sitting in localStorage.
    setState({ gameError: (error as Error).message });
  }
}
