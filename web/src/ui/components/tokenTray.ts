import { SELLABLE_GOODS, type BonusTokenBank, type TokenBank } from "../../engine";
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
  const stack = (title: string, values: number[]) =>
    h(
      "div",
      { class: "bonus-chip" },
      h("span", { class: "bonus-chip__title" }, title),
      h("span", { class: "bonus-chip__value" }, values.length > 0 ? String(values[0]) : "—")
    );

  return h(
    "div",
    { class: "bonus-tray" },
    stack("×3", bank.saleOfThree),
    stack("×4", bank.saleOfFour),
    stack("×5+", bank.saleOfFiveOrMore)
  );
}
