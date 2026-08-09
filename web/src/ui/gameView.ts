import type { Card, GameAction, GameState, GoodType, Player } from "../engine";
import { findPlayer, opponentOf } from "../engine";
import { applyAction, revealBonusToken, startNextRound } from "../firebase/gameService";
import { clearSelections, openRules, setActiveGameCode, setState, state } from "../state";
import { actionBarView } from "./components/actionBar";
import { handView } from "./components/hand";
import { marketView } from "./components/market";
import { playerBarView } from "./components/playerBar";
import { roundEndOverlay } from "./components/roundEndOverlay";
import { rulesModalView } from "./components/rulesModal";
import { bonusTokenSummaryView, tokenTrayView } from "./components/tokenTray";
import { h } from "./h";

function currentGameState(): GameState | null {
  return state.gameDoc?.state ?? null;
}

function me(gameState: GameState): Player | undefined {
  return state.uid ? findPlayer(gameState, state.uid) : undefined;
}

function opponent(gameState: GameState): Player | undefined {
  return state.uid ? opponentOf(gameState, state.uid) : undefined;
}

function isMyTurn(gameState: GameState): boolean {
  return gameState.currentPlayerID === state.uid;
}

function selectedSellGood(gameState: GameState): GoodType | null {
  const myPlayer = me(gameState);
  if (!myPlayer) return null;
  const card = myPlayer.hand.find((c) => state.selectedSellIDs.has(c.id));
  return card?.good ?? null;
}

function canConfirmExchange(): boolean {
  const taken = state.selectedMarketIDs.size;
  const given = state.selectedHandIDs.size + state.selectedCamelsToGive;
  return taken >= 2 && taken <= 5 && taken === given;
}

function canConfirmSell(gameState: GameState): boolean {
  const myPlayer = me(gameState);
  const good = selectedSellGood(gameState);
  if (!myPlayer || !good) return false;
  const cards = myPlayer.hand.filter((c) => state.selectedSellIDs.has(c.id));
  const minimum = good === "diamond" || good === "gold" || good === "silver" ? 2 : 1;
  return cards.every((c) => c.good === good) && cards.length >= minimum;
}

async function perform(action: GameAction): Promise<void> {
  if (!state.gameCode || !state.uid || state.gameBusy) return;
  setState({ gameBusy: true, gameError: null });
  try {
    await applyAction(action, state.gameCode, state.uid);
    clearSelections();
  } catch (error) {
    setState({ gameError: (error as Error).message });
  } finally {
    setState({ gameBusy: false });
  }
}

async function handleRevealBonusToken(playerID: string, tokenIndex: number): Promise<void> {
  if (!state.gameCode) return;
  try {
    await revealBonusToken(state.gameCode, playerID, tokenIndex);
  } catch (error) {
    setState({ gameError: (error as Error).message });
  }
}

async function handleNextRound(): Promise<void> {
  if (!state.gameCode) return;
  setState({ gameBusy: true, gameError: null });
  try {
    await startNextRound(state.gameCode);
  } catch (error) {
    setState({ gameError: (error as Error).message });
  } finally {
    setState({ gameBusy: false });
  }
}

function toggleMarketSelection(card: Card): void {
  if (card.good === "camel") return;
  const next = new Set(state.selectedMarketIDs);
  if (next.has(card.id)) next.delete(card.id);
  else if (next.size < 5) next.add(card.id);
  setState({ selectedMarketIDs: next });
}

function toggleHandForExchange(card: Card): void {
  const next = new Set(state.selectedHandIDs);
  if (next.has(card.id)) next.delete(card.id);
  else next.add(card.id);
  setState({ selectedHandIDs: next });
}

function toggleHandForSale(card: Card): void {
  const next = new Set(state.selectedSellIDs);
  if (next.has(card.id)) next.delete(card.id);
  else next.add(card.id);
  setState({ selectedSellIDs: next });
}

function handleMarketTap(card: Card): void {
  if (state.mode === "exchanging") toggleMarketSelection(card);
  else if (state.mode === "none") perform({ type: "takeCard", marketCardID: card.id });
}

function handleHandTap(card: Card): void {
  if (state.mode === "exchanging") toggleHandForExchange(card);
  else if (state.mode === "selling") toggleHandForSale(card);
}

function copyCode(code: string): void {
  navigator.clipboard?.writeText(code).catch(() => {
    // Clipboard access can fail (e.g. non-HTTPS, permissions) - the code is
    // already shown on screen, so there's nothing more useful to do here.
  });
}

function waitingForOpponentView(code: string): HTMLElement {
  return h(
    "div",
    { class: "game game--loading" },
    h("p", {}, "Share this code with your opponent:"),
    h(
      "button",
      { class: "game__code-big", type: "button", onclick: () => copyCode(code) },
      code,
      h("span", { class: "game__code-hint" }, "tap to copy")
    ),
    h("p", { class: "lobby__hint" }, "Waiting for them to join…"),
    h("button", { class: "btn btn--text", type: "button", onclick: openRules }, "📜 Så spelar du"),
    h("button", { class: "btn btn--secondary", type: "button", onclick: () => setActiveGameCode(null) }, "Leave"),
    state.showRules ? rulesModalView() : null
  );
}

export function gameView(): HTMLElement {
  const gameState = currentGameState();

  if (!gameState) {
    if (state.gameDoc?.status === "waiting" && state.gameCode) {
      return waitingForOpponentView(state.gameCode);
    }
    return h(
      "div",
      { class: "game game--loading" },
      h("p", {}, "Waiting for the game to start…"),
      h("button", { class: "btn btn--secondary", type: "button", onclick: () => setActiveGameCode(null) }, "Leave")
    );
  }

  const myPlayer = me(gameState);
  const opponentPlayer = opponent(gameState);
  const myTurn = isMyTurn(gameState);
  const handDisabled = (card: Card): boolean => {
    if (state.mode !== "selling") return false;
    const good = selectedSellGood(gameState);
    return good != null && card.good !== good;
  };

  const root = h(
    "div",
    { class: "game" },
    h(
      "div",
      { class: "game__topbar" },
      h("button", { class: "btn btn--text", type: "button", onclick: () => setActiveGameCode(null) }, "← Leave"),
      h("span", { class: "game__code" }, state.gameCode ?? ""),
      h("button", { class: "btn btn--text", type: "button", onclick: openRules }, "📜 Regler")
    ),
    opponentPlayer ? playerBarView(opponentPlayer, { isCurrentTurn: gameState.currentPlayerID === opponentPlayer.id, showHandCount: true }) : null,
    h(
      "div",
      { class: "game__board" },
      tokenTrayView(gameState.tokenBank),
      h(
        "div",
        { class: "game__market-column" },
        marketView(gameState.market, {
          interactive: myTurn && state.mode !== "selling",
          exchanging: state.mode === "exchanging",
          selectedIDs: state.selectedMarketIDs,
          onTap: handleMarketTap
        }),
        bonusTokenSummaryView(gameState.bonusTokenBank)
      )
    ),
    state.mode === "exchanging" && myPlayer && myPlayer.camelCount > 0 ? camelStepper(myPlayer.camelCount) : null,
    myPlayer
      ? handView(myPlayer.hand, {
          interactive: myTurn && state.mode !== "none",
          selectedIDs: state.mode === "selling" ? state.selectedSellIDs : state.selectedHandIDs,
          isDisabled: handDisabled,
          onTap: handleHandTap
        })
      : null,
    myPlayer ? playerBarView(myPlayer, { isCurrentTurn: gameState.currentPlayerID === myPlayer.id, showHandCount: false }) : null,
    actionBarView({
      mode: state.mode,
      isMyTurn: myTurn,
      canTakeCamels: gameState.market.some((c) => c.good === "camel"),
      canConfirmExchange: canConfirmExchange(),
      canConfirmSell: canConfirmSell(gameState),
      busy: state.gameBusy,
      onTakeCamels: () => perform({ type: "takeCamels" }),
      onStartExchange: () => setState({ mode: "exchanging" }),
      onStartSell: () => setState({ mode: "selling" }),
      onConfirm: () => {
        if (state.mode === "exchanging" && canConfirmExchange()) {
          perform({
            type: "exchange",
            takenMarketCardIDs: [...state.selectedMarketIDs],
            givenHandCardIDs: [...state.selectedHandIDs],
            givenCamelCount: state.selectedCamelsToGive
          });
        } else if (state.mode === "selling" && canConfirmSell(gameState)) {
          perform({ type: "sell", handCardIDs: [...state.selectedSellIDs] });
        }
      },
      onCancel: () => clearSelections()
    }),
    state.gameError ? h("p", { class: "game__error" }, state.gameError) : null
  );

  if (gameState.roundEndReason && state.uid) {
    root.appendChild(
      roundEndOverlay(gameState, state.uid, {
        busy: state.gameBusy,
        onRevealBonusToken: handleRevealBonusToken,
        onNextRound: handleNextRound,
        onLeave: () => setActiveGameCode(null)
      })
    );
  }

  if (state.showRules) {
    root.appendChild(rulesModalView());
  }

  return root;
}

function camelStepper(camelCount: number): HTMLElement {
  const dec = () => setState({ selectedCamelsToGive: Math.max(0, state.selectedCamelsToGive - 1) });
  const inc = () => setState({ selectedCamelsToGive: Math.min(camelCount, state.selectedCamelsToGive + 1) });
  return h(
    "div",
    { class: "stepper" },
    h("button", { class: "btn btn--secondary", type: "button", onclick: dec }, "−"),
    h("span", {}, `Give ${state.selectedCamelsToGive} camel${state.selectedCamelsToGive === 1 ? "" : "s"} from herd`),
    h("button", { class: "btn btn--secondary", type: "button", onclick: inc }, "+")
  );
}
