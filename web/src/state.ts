import type { GameDocument } from "./firebase/gameDocument";

export type Mode = "none" | "exchanging" | "selling";

export interface AppState {
  uid: string | null;
  displayName: string;
  authError: string | null;

  gameCode: string | null;
  gameDoc: GameDocument | null;

  joinCodeInput: string;
  lobbyBusy: boolean;
  lobbyError: string | null;

  mode: Mode;
  selectedMarketIDs: Set<string>;
  selectedHandIDs: Set<string>;
  selectedCamelsToGive: number;
  selectedSellIDs: Set<string>;
  gameBusy: boolean;
  gameError: string | null;

  showRules: boolean;

  moveToast: string | null;
}

type Listener = () => void;
const listeners = new Set<Listener>();

const DISPLAY_NAME_KEY = "jaipur.displayName";
const GAME_CODE_KEY = "jaipur.gameCode";

function loadDisplayName(): string {
  return localStorage.getItem(DISPLAY_NAME_KEY) ?? `Handlare${Math.floor(100 + Math.random() * 900)}`;
}

export const state: AppState = {
  uid: null,
  displayName: loadDisplayName(),
  authError: null,
  gameCode: localStorage.getItem(GAME_CODE_KEY),
  gameDoc: null,
  joinCodeInput: "",
  lobbyBusy: false,
  lobbyError: null,
  mode: "none",
  selectedMarketIDs: new Set(),
  selectedHandIDs: new Set(),
  selectedCamelsToGive: 0,
  selectedSellIDs: new Set(),
  gameBusy: false,
  gameError: null,
  showRules: false,
  moveToast: null
};

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setState(patch: Partial<AppState>): void {
  Object.assign(state, patch);
  for (const listener of listeners) listener();
}

/**
 * Updates the live display name as the player types. Deliberately does not
 * trim here - trimming on every keystroke would strip a trailing space the
 * instant it's typed, making it impossible to type a multi-word name. Use
 * `effectiveDisplayName()` to get the trimmed value when actually creating
 * or joining a game.
 */
export function setDisplayName(name: string): void {
  setState({ displayName: name });
  const trimmed = name.trim();
  if (trimmed) localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
}

export function effectiveDisplayName(): string {
  return state.displayName.trim() || loadDisplayName();
}

export function setActiveGameCode(code: string | null): void {
  if (code) localStorage.setItem(GAME_CODE_KEY, code);
  else localStorage.removeItem(GAME_CODE_KEY);
  setState({ gameCode: code, gameDoc: null });
  clearSelections();
}

export function openRules(): void {
  setState({ showRules: true });
}

export function closeRules(): void {
  setState({ showRules: false });
}

let moveToastTimer: ReturnType<typeof setTimeout> | null = null;

/** Shows a transient "what just happened" toast, replacing/re-timing any toast already showing. */
export function showMoveToast(text: string): void {
  if (moveToastTimer) clearTimeout(moveToastTimer);
  setState({ moveToast: text });
  moveToastTimer = setTimeout(() => {
    moveToastTimer = null;
    setState({ moveToast: null });
  }, 4000);
}

export function clearSelections(): void {
  setState({
    mode: "none",
    selectedMarketIDs: new Set(),
    selectedHandIDs: new Set(),
    selectedCamelsToGive: 0,
    selectedSellIDs: new Set()
  });
}
