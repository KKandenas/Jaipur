import type { Card } from "../../engine";
import { h } from "../h";
import { cardView } from "./card";

export function marketView(
  cards: Card[],
  options: { interactive: boolean; exchanging: boolean; selectedIDs: Set<string>; onTap: (card: Card) => void }
): HTMLElement {
  return h(
    "div",
    { class: "market" },
    cards.map((card) => {
      const tappable = options.interactive && (options.exchanging || card.good !== "camel");
      return cardView(card, {
        selected: options.selectedIDs.has(card.id),
        disabled: !tappable,
        onClick: tappable ? () => options.onTap(card) : undefined
      });
    })
  );
}
