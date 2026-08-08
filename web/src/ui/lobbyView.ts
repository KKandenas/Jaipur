import { createGame, joinGame } from "../firebase/gameService";
import { effectiveDisplayName, openRules, setActiveGameCode, setDisplayName, setState, state } from "../state";
import { rulesModalView } from "./components/rulesModal";
import { h } from "./h";

async function handleCreate(): Promise<void> {
  if (!state.uid) return;
  setState({ lobbyBusy: true, lobbyError: null });
  try {
    const code = await createGame(state.uid, effectiveDisplayName());
    setActiveGameCode(code);
  } catch (error) {
    setState({ lobbyError: (error as Error).message });
  } finally {
    setState({ lobbyBusy: false });
  }
}

async function handleJoin(): Promise<void> {
  if (!state.uid) return;
  const code = state.joinCodeInput.trim().toUpperCase();
  if (!code) {
    setState({ lobbyError: "Enter a game code first." });
    return;
  }
  setState({ lobbyBusy: true, lobbyError: null });
  try {
    await joinGame(code, state.uid, effectiveDisplayName());
    setActiveGameCode(code);
  } catch (error) {
    setState({ lobbyError: (error as Error).message });
  } finally {
    setState({ lobbyBusy: false });
  }
}

function card(...children: (Node | string)[]): HTMLElement {
  return h("div", { class: "lobby-card" }, ...children);
}

export function lobbyView(): HTMLElement {
  return h(
    "div",
    { class: "lobby" },
    h(
      "div",
      { class: "lobby__header" },
      h("h1", {}, "Jaipur"),
      h("p", {}, "A two-player caravan of trading"),
      h("button", { class: "btn btn--text", type: "button", onclick: openRules }, "📜 How to Play")
    ),
    card(
      h("h2", {}, "Your name"),
      h("input", {
        id: "display-name-input",
        class: "text-input",
        type: "text",
        value: state.displayName,
        maxlength: "24",
        oninput: (event: Event) => setDisplayName((event.target as HTMLInputElement).value)
      })
    ),
    card(
      h("h2", {}, "Start a new game"),
      h("p", { class: "lobby__hint" }, "You'll get a 5-character code to share with your opponent."),
      h(
        "button",
        { class: "btn btn--primary btn--block", type: "button", disabled: state.lobbyBusy || !state.uid, onclick: handleCreate },
        "Create Game"
      )
    ),
    card(
      h("h2", {}, "Join a game"),
      h("input", {
        id: "join-code-input",
        class: "text-input",
        type: "text",
        placeholder: "Game code",
        value: state.joinCodeInput,
        maxlength: "5",
        autocapitalize: "characters",
        oninput: (event: Event) => setState({ joinCodeInput: (event.target as HTMLInputElement).value })
      }),
      h(
        "button",
        {
          class: "btn btn--secondary btn--block",
          type: "button",
          disabled: state.lobbyBusy || !state.uid,
          onclick: handleJoin
        },
        "Join Game"
      )
    ),
    state.lobbyBusy ? h("p", { class: "lobby__status" }, "Working…") : null,
    state.lobbyError ? h("p", { class: "lobby__error" }, state.lobbyError) : null,
    state.authError ? h("p", { class: "lobby__error" }, `Sign-in failed: ${state.authError}`) : null,
    state.showRules ? rulesModalView() : null
  );
}
