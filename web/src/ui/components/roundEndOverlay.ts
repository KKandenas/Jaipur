import { bonusTier, findPlayer, roundResultTotal, type GameState, type RoundResult } from "../../engine";
import bonusThree from "../../assets/bonus/three.png";
import bonusFour from "../../assets/bonus/four.png";
import bonusFive from "../../assets/bonus/five.png";
import { h } from "../h";

const BONUS_TIER_IMAGE = { three: bonusThree, four: bonusFour, five: bonusFive };

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
      const tokenImage = BONUS_TIER_IMAGE[bonusTier(value)];
      return h(
        "button",
        {
          class: `bonus-flip-chip ${revealed ? "bonus-flip-chip--revealed" : ""}`,
          type: "button",
          style: { "--card-image": `url(${tokenImage})` },
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

    const tokenKeys = player ? player.wonBonusTokens.map((_, i) => `${state.roundNumber}-${i}`) : [];
    const allRevealed = tokenKeys.every((key) => options.revealedBonusTokenKeys.has(key));

    const bonusPart: HTMLElement | string =
      isMe && player
        ? bonusFlipRow(player.wonBonusTokens, state.roundNumber, options.revealedBonusTokenKeys, options.onToggleBonusToken)
        : `${result.bonusValue} ₹`;

    const totalKnown = !isMe || allRevealed;

    return h(
      "div",
      { class: `round-end__row ${isMe ? "round-end__row--me" : ""}` },
      h(
        "div",
        { class: "round-end__row-header" },
        h("span", { class: "round-end__row-name" }, isMe ? `You (${name})` : name),
        h(
          "span",
          { class: "round-end__row-total" },
          totalKnown ? `${roundResultTotal(result)} ₹` : "? ₹"
        )
      ),
      h(
        "div",
        { class: "round-end__row-breakdown" },
        h("span", {}, `${result.goodsValue} ₹ goods`),
        h("span", {}, "+"),
        bonusPart,
        h("span", {}, "bonus"),
        h("span", {}, "+"),
        h("span", {}, `${result.camelBonus} ₹ camel`)
      ),
      isMe && !allRevealed ? h("p", { class: "round-end__hint" }, "Tap your bonus tokens to reveal them") : null
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
