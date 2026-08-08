import type { GameState } from "../engine";

export type GameStatus = "waiting" | "active" | "finished";

/**
 * The document at `games/{code}`.
 *
 * Tier-1 (implemented here): the full `GameState` - including the draw pile
 * order and the opponent's hand - lives in one document both players can
 * read. That's enough to play honestly with a friend, but a motivated
 * player could read the Firestore doc directly (or open devtools) and see
 * cards they shouldn't. See the README's "Hardening hidden information"
 * section for the Cloud Functions-based Tier-2 design that closes that gap.
 */
export interface GameDocument {
  status: GameStatus;
  hostID: string;
  hostName: string;
  playerIDs: string[];
  createdAt: number;
  updatedAt: number;
  state: GameState | null;
}
