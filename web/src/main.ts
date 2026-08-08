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
