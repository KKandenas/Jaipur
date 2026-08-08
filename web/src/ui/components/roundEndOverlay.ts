import { findPlayer, roundResultTotal, type GameState, type RoundResult } from "../../engine";
import { h } from "../h";

export function roundEndOverlay(
  state: GameState,
  myID: string,
  options: { busy: boolean; onNextRound: () => void; onLeave: () => void }
): HTMLElement {
  const resultRow = (result: RoundResult) => {
    const name = findPlayer(state, result.playerID)?.displayName ?? "Player";
    return h(
      "div",
      { class: "round-end__row" },
      h("span", { class: "round-end__row-name" }, result.playerID === myID ? `You (${name})` : name),
      h(
        "span",
        { class: "round-end__row-score" },
        `${result.goodsValue} + ${result.bonusValue} bonus + ${result.camelBonus} camel = ${roundResultTotal(result)} ₹`
      )
    );
  };

  const winner = state.winnerID ? findPlayer(state, state.winnerID) : undefined;

  return h(
    "div",
    { class: "overlay" },
    h(
      "div",
      { class: "overlay__card" },
      h("h2", {}, state.winnerID ? "Game Over" : `Round ${state.roundNumber} Complete`),
      h("div", { class: "round-end__results" }, state.lastRoundResults.map(resultRow)),
      state.winnerID
        ? h(
            "p",
            { class: "round-end__winner" },
            state.winnerID === myID ? "🎉 You won the match!" : `${winner?.displayName ?? "Opponent"} won the match.`
          )
        : null,
      state.winnerID
        ? h("button", { class: "btn btn--primary", type: "button", onclick: options.onLeave }, "Back to Lobby")
        : h(
            "button",
            { class: "btn btn--primary", type: "button", disabled: options.busy, onclick: options.onNextRound },
            `Start Round ${state.roundNumber + 1}`
          )
    )
  );
}
