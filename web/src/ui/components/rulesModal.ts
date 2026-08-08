import { closeRules } from "../../state";
import { h } from "../h";

function section(title: string, ...body: HTMLElement[]): HTMLElement {
  return h("section", { class: "rules__section" }, h("h3", {}, title), ...body);
}

function list(...items: string[]): HTMLElement {
  return h(
    "ul",
    {},
    ...items.map((item) => h("li", {}, item))
  );
}

export function rulesModalView(): HTMLElement {
  return h(
    "div",
    { class: "overlay overlay--rules", onclick: (event: MouseEvent) => { if (event.target === event.currentTarget) closeRules(); } },
    h(
      "div",
      { class: "overlay__card overlay__card--rules" },
      h(
        "div",
        { class: "rules__header" },
        h("h2", {}, "How to Play Jaipur"),
        h("button", { class: "btn btn--secondary", type: "button", onclick: closeRules }, "Close")
      ),
      h(
        "div",
        { class: "rules__body" },
        section(
          "Goal",
          h("p", {}, "Trade goods for rupees over up to 3 rounds. First player to win 2 rounds wins the match.")
        ),
        section(
          "Your turn - do exactly one",
          list(
            "Take all camels currently in the market into your herd.",
            "Take a single card from the market into your hand (not a camel - camels only come via the action above).",
            "Exchange 2-5 cards: give that many cards from your hand and/or camels from your herd for that many cards from the market.",
            "Sell one or more cards of the same good from your hand for tokens."
          )
        ),
        section(
          "Selling",
          list(
            "Diamonds, gold and silver: sell at least 2 at once.",
            "Cloth, spice and leather: sell any number, even just 1.",
            "You get the top token(s) off that good's stack - tokens go from high to low value, so selling early is worth more.",
            "Selling 3 or more cards at once also earns a bonus token (bigger sales earn bigger bonuses)."
          )
        ),
        section(
          "Camels",
          h(
            "p",
            {},
            "Camels don't count toward your 7-card hand limit and can't be sold. At the end of a round, whoever has the most camels gets a 5-rupee bonus (nobody gets it on a tie)."
          )
        ),
        section(
          "Hand limit",
          h("p", {}, "You may never end your turn with more than 7 goods cards in hand (camels don't count).")
        ),
        section(
          "Round end",
          list(
            "The round ends the instant 3 of the 6 goods token stacks run out, or the draw pile can't refill the market back to 5 cards.",
            "Whoever has the higher total (tokens + bonuses + camel bonus) wins the round."
          )
        )
      )
    )
  );
}
