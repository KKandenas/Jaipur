import { h } from "../h";
import type { Mode } from "../../state";

export interface ActionBarOptions {
  mode: Mode;
  isMyTurn: boolean;
  canTakeCamels: boolean;
  canConfirmExchange: boolean;
  canConfirmSell: boolean;
  busy: boolean;
  onTakeCamels: () => void;
  onStartExchange: () => void;
  onStartSell: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function button(label: string, opts: { disabled?: boolean; secondary?: boolean; onClick: () => void }): HTMLElement {
  return h(
    "button",
    {
      class: `btn ${opts.secondary ? "btn--secondary" : "btn--primary"}`,
      type: "button",
      disabled: opts.disabled,
      onclick: opts.onClick
    },
    label
  );
}

export function actionBarView(o: ActionBarOptions): HTMLElement {
  const bar = h("div", { class: `action-bar ${o.busy ? "action-bar--busy" : ""}` });

  if (o.mode === "none") {
    bar.append(
      button("🐫 Ta kameler", { disabled: !o.isMyTurn || !o.canTakeCamels || o.busy, onClick: o.onTakeCamels }),
      button("⇄ Byt", { disabled: !o.isMyTurn || o.busy, onClick: o.onStartExchange }),
      button("₹ Sälj", { disabled: !o.isMyTurn || o.busy, onClick: o.onStartSell })
    );
  } else {
    const hint =
      o.mode === "exchanging"
        ? "Välj 2–5 marknadskort, matcha sedan med handkort + kameler."
        : "Välj kort av samma vara att sälja.";
    bar.append(
      h("p", { class: "action-bar__hint" }, hint),
      button("Avbryt", { secondary: true, onClick: o.onCancel }),
      button("Bekräfta", {
        disabled: o.busy || (o.mode === "exchanging" ? !o.canConfirmExchange : !o.canConfirmSell),
        onClick: o.onConfirm
      })
    );
  }

  return bar;
}
