import type { Card } from "../../engine";
import { h } from "../h";
import { cardView } from "./card";

export function handView(
  cards: Card[],
  options: {
    interactive: boolean;
    selectedIDs: Set<string>;
    isDisabled: (card: Card) => boolean;
    onTap: (card: Card) => void;
  }
): HTMLElement {
  return h(
    "div",
    { class: "hand" },
    cards.map((card) => {
      const disabled = options.isDisabled(card);
      return cardView(card, {
        selected: options.selectedIDs.has(card.id),
        disabled,
        onClick: options.interactive && !disabled ? () => options.onTap(card) : undefined
      });
    })
  );
}
