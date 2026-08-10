import { bonusTier, roundGoodsValue, type BonusTier, type Player } from "../../engine";
import bonusThree from "../../assets/bonus/three.png";
import bonusFour from "../../assets/bonus/four.png";
import bonusFive from "../../assets/bonus/five.png";
import { goodStyle } from "../goodStyle";
import { h } from "../h";

const BONUS_TIER_IMAGE: Record<BonusTier, string> = { three: bonusThree, four: bonusFour, five: bonusFive };
const BONUS_TIER_LABEL: Record<BonusTier, string> = { three: "3-korts", four: "4-korts", five: "5+-korts" };

/**
 * Which tier a bonus token came from is never secret information - a player
 * always knows how many cards they (or their opponent) sold at once, only
 * the exact value within that tier stays hidden until the round-end reveal.
 * Showing the per-tier counts here lets both players roughly gauge how many
 * points are in play well before then.
 */
function bonusTierCounts(player: Player): Partial<Record<BonusTier, number>> {
  const counts: Partial<Record<BonusTier, number>> = {};
  for (const value of player.wonBonusTokens) {
    const tier = bonusTier(value);
    counts[tier] = (counts[tier] ?? 0) + 1;
  }
  return counts;
}

export function playerBarView(player: Player, options: { isCurrentTurn: boolean; showHandCount: boolean }): HTMLElement {
  const tierCounts = bonusTierCounts(player);
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
      h("div", { class: "player-bar__rounds" }, `${player.roundsWon} rondvinst${player.roundsWon === 1 ? "" : "er"}`)
    ),
    h(
      "div",
      { class: "player-bar__stat" },
      h("img", { class: "player-bar__icon", src: goodStyle("camel").cardImage, alt: "Kameler" }),
      String(player.camelCount)
    ),
    options.showHandCount ? h("div", { class: "player-bar__stat" }, `🂠 ${player.hand.length}`) : null,
    ...(["three", "four", "five"] as BonusTier[])
      .filter((tier) => tierCounts[tier])
      .map((tier) =>
        h(
          "div",
          {
            class: "player-bar__stat player-bar__stat--bonus",
            title: `${tierCounts[tier]} bonuspollett${tierCounts[tier] === 1 ? "" : "er"} från ${BONUS_TIER_LABEL[tier]} försäljning - exakt värde dolt tills ronden är slut`
          },
          h("img", { class: "player-bar__icon player-bar__icon--bonus", src: BONUS_TIER_IMAGE[tier], alt: `${BONUS_TIER_LABEL[tier]} bonus` }),
          String(tierCounts[tier])
        )
      ),
    h("div", { class: "player-bar__stat player-bar__stat--value" }, `${roundGoodsValue(player)} ₹`)
  );
}
