type Child = Node | string | number | null | undefined | false | Child[];

/** Allows both real CSS properties and custom properties (`--card-color`, etc). */
type StyleProp = Partial<CSSStyleDeclaration> & { [customProperty: `--${string}`]: string };

type Props = Record<string, unknown> & {
  class?: string;
  style?: StyleProp;
};

/** Tiny hyperscript-style DOM builder - no framework, no VDOM, just element creation. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "class") {
      el.className = String(value);
    } else if (key === "style" && typeof value === "object") {
      Object.assign(el.style, value as Partial<CSSStyleDeclaration>);
    } else if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key === "disabled" || key === "checked" || key === "value") {
      // @ts-expect-error - dynamic DOM property assignment for common form props
      el[key] = value;
    } else {
      el.setAttribute(key, String(value));
    }
  }

  appendChildren(el, children);
  return el;
}

function appendChildren(el: HTMLElement, children: Child[]): void {
  for (const child of children) {
    if (child == null || child === false) continue;
    if (Array.isArray(child)) {
      appendChildren(el, child);
    } else if (typeof child === "string" || typeof child === "number") {
      el.appendChild(document.createTextNode(String(child)));
    } else {
      el.appendChild(child);
    }
  }
}

export function clear(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/**
 * Replaces `root`'s children with `child`. Since there's no VDOM diffing here,
 * every render rebuilds the whole subtree - which would normally steal focus
 * (and dismiss the on-screen keyboard on iOS) out from under whatever input
 * the player is mid-typing into. This preserves focus + cursor position
 * across the rebuild for any input/textarea carrying a stable `id`.
 */
export function mount(root: HTMLElement, child: Node): void {
  const active = document.activeElement;
  let focusId: string | null = null;
  let selectionStart: number | null = null;
  let selectionEnd: number | null = null;

  if ((active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) && root.contains(active) && active.id) {
    focusId = active.id;
    selectionStart = active.selectionStart;
    selectionEnd = active.selectionEnd;
  }

  clear(root);
  root.appendChild(child);

  if (focusId) {
    const next = root.querySelector<HTMLElement>(`#${CSS.escape(focusId)}`);
    if (next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement) {
      next.focus();
      if (selectionStart != null && selectionEnd != null) {
        next.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }
}
