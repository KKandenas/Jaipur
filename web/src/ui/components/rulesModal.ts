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
        h("h2", {}, "Så spelar du Jaipur"),
        h("button", { class: "btn btn--secondary", type: "button", onclick: closeRules }, "Stäng")
      ),
      h(
        "div",
        { class: "rules__body" },
        section(
          "Mål",
          h("p", {}, "Handla varor mot rupier under upp till 3 ronder. Den som vinner 2 ronder vinner matchen.")
        ),
        section(
          "Din tur - gör exakt en sak",
          list(
            "Ta alla kameler som just nu finns på marknaden till din hjord.",
            "Ta ett enda kort från marknaden till din hand (inte en kamel - kameler får du bara via åtgärden ovan).",
            "Byt 2-5 kort: ge lika många kort från din hand och/eller kameler från din hjord mot lika många kort från marknaden.",
            "Sälj ett eller flera kort av samma vara från din hand mot polletter."
          )
        ),
        section(
          "Att sälja",
          list(
            "Diamanter, guld och silver: sälj minst 2 åt gången.",
            "Tyg, kryddor och läder: sälj valfritt antal, även bara 1.",
            "Du får de översta polletterna från varans hög - polletterna går från högt till lågt värde, så det lönar sig att sälja tidigt.",
            "Att sälja 3 eller fler kort samtidigt ger även en bonuspollett (större försäljningar ger större bonusar)."
          )
        ),
        section(
          "Kameler",
          h(
            "p",
            {},
            "Kameler räknas inte mot din handgräns på 7 kort och kan inte säljas. I slutet av en rond får den som har flest kameler en bonus på 5 rupier (ingen får den vid oavgjort)."
          )
        ),
        section(
          "Handgräns",
          h("p", {}, "Du får aldrig avsluta din tur med fler än 7 varukort på hand (kameler räknas inte).")
        ),
        section(
          "Rondens slut",
          list(
            "Ronden tar slut så fort 3 av de 6 varupollett-högarna tar slut, eller om draghögen inte längre kan fylla på marknaden till 5 kort.",
            "Den med högst totalsumma (polletter + bonusar + kamelbonus) vinner ronden."
          )
        )
      )
    )
  );
}
