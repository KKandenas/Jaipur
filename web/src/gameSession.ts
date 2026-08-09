import { observeGame } from "./firebase/gameService";
import { clearSelections, setState, state } from "./state";

let unsubscribe: (() => void) | null = null;
let subscribedCode: string | null = null;

/**
 * Keeps the Firestore listener in sync with `state.gameCode`. Cheap to call
 * repeatedly (e.g. on every render tick) - it only does work when the code
 * actually changed since the last call, unless `force` is set.
 *
 * `force` tears down and re-creates the listener even for an unchanged game
 * code. iOS Safari (especially a PWA added to the home screen) can silently
 * drop the underlying long-polling connection while backgrounded without
 * onSnapshot noticing - the opponent's moves stop arriving until something
 * re-establishes the connection, which previously only happened on a manual
 * page reload. Re-subscribing delivers a fresh snapshot immediately (the
 * whole reason to call this with force: true from a visibility/focus/online
 * event) and opens a new, live connection going forward.
 */
export function syncGameSubscription(force = false): void {
  if (!force && state.gameCode === subscribedCode) return;

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
