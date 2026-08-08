import type { Card } from "../../engine";
import cardBack from "../../assets/card-back.jpg";
import { goodStyle } from "../goodStyle";
import { h } from "../h";

export interface CardViewOptions {
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function cardView(card: Card, options: CardViewOptions = {}): HTMLElement {
  const style = goodStyle(card.good);
  return h("button", {
    class: [
      "card",
      options.selected ? "card--selected" : "",
      options.disabled ? "card--disabled" : "",
      options.onClick ? "card--interactive" : ""
    ]
      .filter(Boolean)
      .join(" "),
    type: "button",
    disabled: options.disabled || !options.onClick,
    style: { "--card-color": style.color, "--card-image": `url(${style.cardImage})` },
    "aria-label": style.label,
    onclick: options.onClick
  });
}

export function cardBackView(): HTMLElement {
  return h("div", { class: "card card--back", style: { "--card-image": `url(${cardBack})` } });
}
