import { createGame, joinGame } from "../firebase/gameService";
import { effectiveDisplayName, openRules, setActiveGameCode, setDisplayName, setState, state } from "../state";
import { rulesModalView } from "./components/rulesModal";
import { describeError } from "./errorMessages";
import { h } from "./h";

async function handleCreate(): Promise<void> {
  if (!state.uid) return;
  setState({ lobbyBusy: true, lobbyError: null });
  try {
    const code = await createGame(state.uid, effectiveDisplayName());
    setActiveGameCode(code);
  } catch (error) {
    setState({ lobbyError: describeError(error) });
  } finally {
    setState({ lobbyBusy: false });
  }
}

async function handleJoin(): Promise<void> {
  if (!state.uid) return;
  const code = state.joinCodeInput.trim().toUpperCase();
  if (!code) {
    setState({ lobbyError: "Ange en spelkod först." });
    return;
  }
  setState({ lobbyBusy: true, lobbyError: null });
  try {
    await joinGame(code, state.uid, effectiveDisplayName());
    setActiveGameCode(code);
  } catch (error) {
    setState({ lobbyError: describeError(error) });
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
      h("p", {}, "En handelskaravan för två spelare"),
      h("button", { class: "btn btn--text", type: "button", onclick: openRules }, "📜 Så spelar du")
    ),
    card(
      h("h2", {}, "Ditt namn"),
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
      h("h2", {}, "Starta ett nytt spel"),
      h("p", { class: "lobby__hint" }, "Du får en 5-teckenskod att dela med din motståndare."),
      h(
        "button",
        { class: "btn btn--primary btn--block", type: "button", disabled: state.lobbyBusy || !state.uid, onclick: handleCreate },
        "Skapa spel"
      )
    ),
    card(
      h("h2", {}, "Gå med i ett spel"),
      h("input", {
        id: "join-code-input",
        class: "text-input",
        type: "text",
        placeholder: "Spelkod",
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
        "Gå med"
      )
    ),
    state.lobbyBusy ? h("p", { class: "lobby__status" }, "Arbetar…") : null,
    state.lobbyError ? h("p", { class: "lobby__error" }, state.lobbyError) : null,
    state.authError ? h("p", { class: "lobby__error" }, `Inloggning misslyckades: ${state.authError}`) : null,
    state.showRules ? rulesModalView() : null
  );
}
