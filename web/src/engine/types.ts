export type GoodType = "camel" | "diamond" | "gold" | "silver" | "cloth" | "spice" | "leather";

export const ALL_GOODS: GoodType[] = ["camel", "diamond", "gold", "silver", "cloth", "spice", "leather"];
export const SELLABLE_GOODS: GoodType[] = ALL_GOODS.filter((g) => g !== "camel");

export const PRECIOUS_GOODS: ReadonlySet<GoodType> = new Set(["diamond", "gold", "silver"]);

export function isPrecious(good: GoodType): boolean {
  return PRECIOUS_GOODS.has(good);
}

/** Minimum number of cards that must be sold at once for this good. */
export function minimumSaleSize(good: GoodType): number {
  return isPrecious(good) ? 2 : 1;
}

/** Number of cards of this type in the 55-card deck. */
export function deckCount(good: GoodType): number {
  switch (good) {
    case "camel":
      return 11;
    case "diamond":
      return 6;
    case "gold":
      return 6;
    case "silver":
      return 6;
    case "cloth":
      return 8;
    case "spice":
      return 8;
    case "leather":
      return 10;
  }
}

export interface Card {
  id: string;
  good: GoodType;
}

export interface Player {
  id: string;
  displayName: string;
  /** Goods cards only (never camels). Limited to 7 at the end of any turn. */
  hand: Card[];
  /** Camels are fungible and tracked purely as a count in the player's herd. */
  camelCount: number;
  /** Goods tokens won this round, keyed by good, each entry one token's value. */
  wonTokens: Partial<Record<GoodType, number[]>>;
  /** Bonus tokens won this round. */
  wonBonusTokens: number[];
  /** Round wins across the whole match (first to 2 wins the game). */
  roundsWon: number;
}

export const HAND_LIMIT = 7;

export function newPlayer(id: string, displayName: string): Player {
  return { id, displayName, hand: [], camelCount: 0, wonTokens: {}, wonBonusTokens: [], roundsWon: 0 };
}

export function roundGoodsValue(player: Player): number {
  return SELLABLE_GOODS.reduce((sum, good) => sum + (player.wonTokens[good]?.reduce((a, b) => a + b, 0) ?? 0), 0);
}

export function roundBonusValue(player: Player): number {
  return player.wonBonusTokens.reduce((a, b) => a + b, 0);
}

export interface TokenBank {
  stacks: Record<GoodType, number[]>;
}

export interface BonusTokenBank {
  saleOfThree: number[];
  saleOfFour: number[];
  saleOfFiveOrMore: number[];
}

export type RoundEndReason = "threeStacksExhausted" | "deckExhausted";

export interface RoundResult {
  playerID: string;
  goodsValue: number;
  bonusValue: number;
  camelBonus: number;
}

export function roundResultTotal(result: RoundResult): number {
  return result.goodsValue + result.bonusValue + result.camelBonus;
}

export interface GameState {
  players: [Player, Player];
  market: Card[];
  drawPile: Card[];
  discard: Card[];
  tokenBank: TokenBank;
  bonusTokenBank: BonusTokenBank;
  currentPlayerID: string;
  roundNumber: number;
  roundEndReason: RoundEndReason | null;
  lastRoundResults: RoundResult[];
  winnerID: string | null;
}

export function isRoundOver(state: GameState): boolean {
  return state.roundEndReason !== null;
}

export function isGameOver(state: GameState): boolean {
  return state.winnerID !== null;
}

export function findPlayer(state: GameState, id: string): Player | undefined {
  return state.players.find((p) => p.id === id);
}

export function opponentOf(state: GameState, id: string): Player | undefined {
  return state.players.find((p) => p.id !== id);
}

export type GameAction =
  | { type: "takeCamels" }
  | { type: "takeCard"; marketCardID: string }
  | { type: "exchange"; takenMarketCardIDs: string[]; givenHandCardIDs: string[]; givenCamelCount: number }
  | { type: "sell"; handCardIDs: string[] };

export type GameErrorCode =
  | "notYourTurn"
  | "gameAlreadyOver"
  | "roundAlreadyOver"
  | "cardNotInMarket"
  | "cardNotInHand"
  | "cannotTakeCamelViaSingleTake"
  | "noCamelsInMarket"
  | "handLimitExceeded"
  | "exchangeCountOutOfRange"
  | "exchangeCountMismatch"
  | "exchangeCannotIncludeCamelFromMarket"
  | "exchangeInsufficientCamelsInHerd"
  | "sellRequiresCardsOfSameGood"
  | "sellBelowMinimumForPreciousGood"
  | "emptyAction";

export class GameError extends Error {
  readonly code: GameErrorCode;
  constructor(code: GameErrorCode) {
    super(code);
    this.code = code;
    this.name = "GameError";
  }
}
