import { SELLABLE_GOODS, type BonusTokenBank, type TokenBank } from "../../engine";
import bonusThree from "../../assets/bonus/three.png";
import bonusFour from "../../assets/bonus/four.png";
import bonusFive from "../../assets/bonus/five.png";
import { goodStyle } from "../goodStyle";
import { h } from "../h";

export function tokenTrayView(tokenBank: TokenBank): HTMLElement {
  return h(
    "div",
    { class: "token-tray" },
    SELLABLE_GOODS.map((good) => {
      const values = tokenBank.stacks[good] ?? [];
      const style = goodStyle(good);
      const depleted = values.length === 0;
      return h(
        "div",
        {
          class: `token-chip ${depleted ? "token-chip--empty" : ""}`,
          style: { "--card-color": style.color, "--card-image": `url(${style.tokenImage})` },
          title: `${style.label}: ${values.length} left`
        },
        h("span", { class: "token-chip__value" }, depleted ? "—" : String(values[0])),
        h("span", { class: "token-chip__count" }, String(values.length))
      );
    })
  );
}

export function bonusTokenSummaryView(bank: BonusTokenBank): HTMLElement {
  const stack = (title: string, values: number[], tokenImage: string) =>
    h(
      "div",
      { class: "bonus-chip" },
      h("span", { class: "bonus-chip__title" }, title),
      h(
        "span",
        { class: "bonus-chip__value", style: { "--card-image": `url(${tokenImage})` } },
        values.length > 0 ? String(values[0]) : "—"
      )
    );

  return h(
    "div",
    { class: "bonus-tray" },
    stack("×3", bank.saleOfThree, bonusThree),
    stack("×4", bank.saleOfFour, bonusFour),
    stack("×5+", bank.saleOfFiveOrMore, bonusFive)
  );
}
