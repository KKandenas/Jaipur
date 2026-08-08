import { findPlayer, roundResultTotal, type GameState, type RoundResult } from "../../engine";
import { h } from "../h";

function bonusFlipRow(
  tokens: number[],
  roundNumber: number,
  revealedKeys: Set<string>,
  onToggle: (key: string) => void
): HTMLElement {
  return h(
    "span",
    { class: "bonus-flip-row" },
    tokens.map((value, index) => {
      const key = `${roundNumber}-${index}`;
      const revealed = revealedKeys.has(key);
      return h(
        "button",
        {
          class: `bonus-flip-chip ${revealed ? "bonus-flip-chip--revealed" : ""}`,
          type: "button",
          title: revealed ? undefined : "Tap to reveal",
          onclick: () => onToggle(key)
        },
        revealed ? String(value) : "?"
      );
    })
  );
}

export function roundEndOverlay(
  state: GameState,
  myID: string,
  options: {
    busy: boolean;
    revealedBonusTokenKeys: Set<string>;
    onToggleBonusToken: (key: string) => void;
    onNextRound: () => void;
    onLeave: () => void;
  }
): HTMLElement {
  const resultRow = (result: RoundResult) => {
    const player = findPlayer(state, result.playerID);
    const name = player?.displayName ?? "Player";
    const isMe = result.playerID === myID;
    const bonusPart: HTMLElement | string =
      isMe && player
        ? bonusFlipRow(player.wonBonusTokens, state.roundNumber, options.revealedBonusTokenKeys, options.onToggleBonusToken)
        : `${result.bonusValue}`;
    return h(
      "div",
      { class: "round-end__row" },
      h("span", { class: "round-end__row-name" }, isMe ? `You (${name})` : name),
      h(
        "span",
        { class: "round-end__row-score" },
        `${result.goodsValue} + `,
        bonusPart,
        ` bonus + ${result.camelBonus} camel = ${roundResultTotal(result)} ₹`
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
