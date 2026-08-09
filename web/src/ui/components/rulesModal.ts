import type { GoodType } from "../../engine";
import { SELLABLE_GOODS } from "../../engine";
import bonusThree from "../../assets/bonus/three.png";
import bonusFour from "../../assets/bonus/four.png";
import bonusFive from "../../assets/bonus/five.png";
import { closeRules } from "../../state";
import { goodStyle } from "../goodStyle";
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

function cardThumb(good: GoodType): HTMLElement {
  const style = goodStyle(good);
  return h("img", { class: "rules-thumb rules-thumb--card", src: style.cardImage, alt: style.label });
}

function tokenThumb(good: GoodType): HTMLElement {
  const style = goodStyle(good);
  return h("img", { class: "rules-thumb rules-thumb--token", src: style.tokenImage ?? style.cardImage, alt: `${style.label}-token` });
}

function bonusThumb(image: string, label: string): HTMLElement {
  return h("img", { class: "rules-thumb rules-thumb--token", src: image, alt: label });
}

function thumbRow(...thumbs: HTMLElement[]): HTMLElement {
  return h("div", { class: "rules-thumb-row" }, ...thumbs);
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
          "Upplägg",
          list(
            "Marknaden startar med 3 kamelkort plus 2 slumpmässiga varukort - detta sköts automatiskt av appen.",
            "Varje spelare får 5 kort på hand. Om en kamel skulle delas ut läggs den direkt i din kamelhord istället för på handen (kameler räknas aldrig som ett handkort).",
            "Varutokens ligger sorterade i högar per vara, högst värde överst. Bonuspolletter för 3-, 4- och 5-korts-försäljningar ligger i egna högar."
          )
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
          thumbRow(cardThumb("diamond"), cardThumb("gold"), cardThumb("silver")),
          h("p", { class: "rules-thumb-caption" }, "Diamanter, guld och silver: sälj minst 2 åt gången."),
          thumbRow(cardThumb("cloth"), cardThumb("spice"), cardThumb("leather")),
          h("p", { class: "rules-thumb-caption" }, "Tyg, kryddor och läder: sälj valfritt antal, även bara 1."),
          list(
            "Du får de översta polletterna från varans hög - polletterna går från högt till lågt värde, så det lönar sig att sälja tidigt.",
            "Att sälja 3 eller fler kort samtidigt ger även en bonuspollett (större försäljningar ger större bonusar)."
          ),
          thumbRow(bonusThumb(bonusThree, "3-korts bonus"), bonusThumb(bonusFour, "4-korts bonus"), bonusThumb(bonusFive, "5-korts bonus")),
          h(
            "p",
            { class: "rules-thumb-caption" },
            "Bonuspollettens värde är hemligt - du ser bara att du fått en, inte vad den är värd förrän ronden är slut och du vänder på den."
          )
        ),
        section(
          "Kameler",
          thumbRow(cardThumb("camel")),
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
        ),
        section(
          "Spelets innehåll",
          list("55 kort: 6 diamant, 6 guld, 6 silver, 8 tyg, 8 kryddor, 10 läder, 11 kameler."),
          thumbRow(...["camel", ...SELLABLE_GOODS].map((good) => cardThumb(good as GoodType))),
          list(
            "38 varutokens: 5 diamant (7,7,5,5,5), 5 guld (6,6,5,5,5), 5 silver (5,5,5,5,5), 7 tyg (5,3,3,2,2,1,1), 7 kryddor (5,3,3,2,2,1,1), 9 läder (4,3,2,1,1,1,1,1,1)."
          ),
          thumbRow(...SELLABLE_GOODS.map((good) => tokenThumb(good))),
          list("18 bonuspolletter (6 st per storlek, hemliga tills ronden är slut): 3-kort värde 1-3, 4-kort värde 4-6, 5+-kort värde 8-10."),
          thumbRow(bonusThumb(bonusThree, "3-korts bonus"), bonusThumb(bonusFour, "4-korts bonus"), bonusThumb(bonusFive, "5-korts bonus")),
          list(
            "1 kameltoken värd 5 poäng till den med flest kameler i hjorden.",
            "3 Excellence-sigill - ett delas ut per rondvinst, och du behöver bara 2 för att vinna matchen."
          )
        )
      )
    )
  );
}
