import "./style.css";
import { ensureSignedIn } from "./firebase/auth";
import { syncGameSubscription } from "./gameSession";
import { setState, state, subscribe } from "./state";
import { mount } from "./ui/h";
import { gameView } from "./ui/gameView";
import { lobbyView } from "./ui/lobbyView";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Missing #app root element");
}

function render(): void {
  syncGameSubscription();
  mount(root as HTMLElement, state.gameCode ? gameView() : lobbyView());
}

subscribe(render);
render();

ensureSignedIn()
  .then((user) => setState({ uid: user.uid }))
  .catch((error: unknown) => setState({ authError: (error as Error).message }));

/**
 * iOS Safari can silently drop the Firestore realtime connection while the
 * tab/PWA is backgrounded (locked screen, app-switched away, etc.) without
 * the SDK noticing - moves made on the other device then just don't show up
 * until something re-establishes the connection. Previously that only
 * happened on a manual page reload. Forcing a fresh subscription whenever
 * the app becomes visible/focused again (or regains network) fixes that
 * without waiting for a reload.
 */
function refreshOnResume(): void {
  if (document.visibilityState === "hidden") return;
  syncGameSubscription(true);
}

document.addEventListener("visibilitychange", refreshOnResume);
window.addEventListener("pageshow", refreshOnResume);
window.addEventListener("focus", refreshOnResume);
window.addEventListener("online", refreshOnResume);

/**
 * Belt-and-braces on top of refreshOnResume(): the dropped-connection issue
 * above can also happen without any tab-visibility change (a flaky mobile
 * network switching cell towers or WiFi/cellular mid-game), so periodically
 * force a fresh subscription while a game is in play regardless. Cheap - one
 * Firestore read every 15s only while state.gameCode is set, not a constant
 * poll of the whole app.
 */
setInterval(() => {
  if (state.gameCode) syncGameSubscription(true);
}, 15000);
