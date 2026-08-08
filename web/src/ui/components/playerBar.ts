import { roundBonusValue, roundGoodsValue, type Player } from "../../engine";
import camelToken from "../../assets/camel-token.jpg";
import { h } from "../h";

export function playerBarView(player: Player, options: { isCurrentTurn: boolean; showHandCount: boolean }): HTMLElement {
  return h(
    "div",
    { class: "player-bar" },
    h(
      "div",
      { class: "player-bar__identity" },
      h(
        "div",
        { class: "player-bar__name" },
        options.isCurrentTurn ? h("span", { class: "player-bar__turn-dot" }) : null,
        player.displayName
      ),
      h("div", { class: "player-bar__rounds" }, `${player.roundsWon} round win${player.roundsWon === 1 ? "" : "s"}`)
    ),
    h(
      "div",
      { class: "player-bar__stat" },
      h("img", { class: "player-bar__icon", src: camelToken, alt: "Camels" }),
      String(player.camelCount)
    ),
    options.showHandCount ? h("div", { class: "player-bar__stat" }, `🂠 ${player.hand.length}`) : null,
    h("div", { class: "player-bar__stat player-bar__stat--value" }, `${roundGoodsValue(player) + roundBonusValue(player)} ₹`)
  );
}
