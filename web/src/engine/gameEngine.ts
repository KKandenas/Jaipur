import { freshCards } from "./deck";
import { newBonusTokenBank, drawBonus } from "./bonusTokenBank";
import { newTokenBank, exhaustedStackCount, takeTokens } from "./tokenBank";
import { defaultRandom, shuffled, type RandomSource } from "./rng";
import {
  GameError,
  HAND_LIMIT,
  findPlayer,
  isGameOver,
  isRoundOver,
  newPlayer,
  roundBonusValue,
  roundGoodsValue,
  roundResultTotal,
  type Card,
  type GameAction,
  type GameState,
  type Player,
  type RoundResult
} from "./types";

/**
 * Pure, deterministic Jaipur rules engine. `GameState` is treated as an
 * immutable value: every function here takes a state and returns a brand
 * new one (via `structuredClone`) rather than mutating its input. That's
 * what makes it safe to run inside a Firestore transaction (read state,
 * apply, write state) and easy to unit test.
 */

/**
 * Deals the next 5 cards off `drawPile` as a starting hand. Any camels among
 * them go straight to the herd, never into the hand - camels are never
 * treated as ordinary hand cards at any point in the game, and the initial
 * deal is the one place that distinction isn't already enforced by an
 * action's own rules (every in-game action that could add a camel to a
 * hand is rejected by `apply`).
 */
function dealStartingHand(drawPile: Card[]): { hand: Card[]; camelCount: number; remaining: Card[] } {
  const dealt = drawPile.slice(0, 5);
  const remaining = drawPile.slice(5);
  const hand = dealt.filter((card) => card.good !== "camel");
  const camelCount = dealt.length - hand.length;
  return { hand, camelCount, remaining };
}

function dealMarketAndDrawPile(random: RandomSource): { market: Card[]; drawPile: Card[] } {
  let deck = shuffled(freshCards(), random);

  const market: Card[] = [];
  let camelsPlaced = 0;
  deck = deck.filter((card) => {
    if (card.good === "camel" && camelsPlaced < 3) {
      market.push(card);
      camelsPlaced += 1;
      return false;
    }
    return true;
  });
  market.push(...deck.slice(0, 2));
  deck = deck.slice(2);
  return { market, drawPile: deck };
}

export function newGame(
  playerID1: string,
  playerName1: string,
  playerID2: string,
  playerName2: string,
  random: RandomSource = defaultRandom
): GameState {
  const players: [Player, Player] = [newPlayer(playerID1, playerName1), newPlayer(playerID2, playerName2)];
  const { market, drawPile } = dealMarketAndDrawPile(random);

  const deal0 = dealStartingHand(drawPile);
  players[0].hand = deal0.hand;
  players[0].camelCount = deal0.camelCount;
  const deal1 = dealStartingHand(deal0.remaining);
  players[1].hand = deal1.hand;
  players[1].camelCount = deal1.camelCount;
  const remaining = deal1.remaining;

  const startingPlayer = random() < 0.5 ? playerID1 : playerID2;

  return {
    players,
    market,
    drawPile: remaining,
    discard: [],
    tokenBank: newTokenBank(),
    bonusTokenBank: newBonusTokenBank(random),
    currentPlayerID: startingPlayer,
    roundNumber: 1,
    roundEndReason: null,
    lastRoundResults: [],
    winnerID: null
  };
}

/** House rule: the player who scored lower in the previous round opens the
 * next one; on an exact tie, starting player alternates by round number. */
function nextRoundStarter(state: GameState): string {
  if (state.lastRoundResults.length !== 2) {
    return state.players[state.roundNumber % 2].id;
  }
  const [a, b] = state.lastRoundResults;
  const totalA = roundResultTotal(a);
  const totalB = roundResultTotal(b);
  if (totalA === totalB) {
    return state.players[state.roundNumber % 2].id;
  }
  return totalA < totalB ? a.playerID : b.playerID;
}

/** Resets the board for a new round while keeping each player's `roundsWon` tally. */
export function startNextRound(input: GameState, random: RandomSource = defaultRandom): GameState {
  const state = structuredClone(input);
  const starter = nextRoundStarter(state);

  const players = state.players.map(
    (player): Player => ({
      ...player,
      hand: [],
      camelCount: 0,
      wonTokens: {},
      wonBonusTokens: [],
      revealedBonusTokenIndices: []
    })
  ) as [Player, Player];

  const { market, drawPile } = dealMarketAndDrawPile(random);
  const deal0 = dealStartingHand(drawPile);
  players[0].hand = deal0.hand;
  players[0].camelCount = deal0.camelCount;
  const deal1 = dealStartingHand(deal0.remaining);
  players[1].hand = deal1.hand;
  players[1].camelCount = deal1.camelCount;
  const remaining = deal1.remaining;

  return {
    players,
    market,
    drawPile: remaining,
    discard: [],
    tokenBank: newTokenBank(),
    bonusTokenBank: newBonusTokenBank(random),
    currentPlayerID: starter,
    roundNumber: state.roundNumber + 1,
    roundEndReason: null,
    lastRoundResults: [],
    winnerID: null
  };
}

/**
 * Flips one of `playerID`'s bonus tokens face-up. Deliberately not gated by
 * turn order or round/game-over state - either player can flip either
 * player's tokens at any point once they're won, matching the physical
 * game's simultaneous reveal at scoring time. Idempotent: flipping an
 * already-revealed token is a no-op.
 */
export function revealBonusToken(input: GameState, playerID: string, tokenIndex: number): GameState {
  const state = structuredClone(input);
  const player = state.players.find((p) => p.id === playerID);
  if (!player || tokenIndex < 0 || tokenIndex >= player.wonBonusTokens.length) return state;
  if (!player.revealedBonusTokenIndices.includes(tokenIndex)) {
    player.revealedBonusTokenIndices.push(tokenIndex);
  }
  return state;
}

export function apply(action: GameAction, playerID: string, input: GameState): GameState {
  if (isGameOver(input)) throw new GameError("gameAlreadyOver");
  if (isRoundOver(input)) throw new GameError("roundAlreadyOver");
  if (input.currentPlayerID !== playerID) throw new GameError("notYourTurn");

  const state = structuredClone(input);
  const playerIndex = state.players.findIndex((p) => p.id === playerID);
  if (playerIndex === -1) throw new GameError("notYourTurn");

  switch (action.type) {
    case "takeCamels":
      applyTakeCamels(state, playerIndex);
      break;
    case "takeCard":
      applyTakeCard(state, playerIndex, action.marketCardID);
      break;
    case "exchange":
      applyExchange(state, playerIndex, action.takenMarketCardIDs, action.givenHandCardIDs, action.givenCamelCount);
      break;
    case "sell":
      applySell(state, playerIndex, action.handCardIDs);
      break;
  }

  if (state.players[playerIndex].hand.length > HAND_LIMIT) {
    throw new GameError("handLimitExceeded");
  }

  evaluateRoundEnd(state);

  if (!isRoundOver(state)) {
    const opponent = state.players.find((p) => p.id !== playerID);
    state.currentPlayerID = opponent?.id ?? state.currentPlayerID;
  }

  return state;
}

function refillMarket(state: GameState, count = 5): void {
  const needed = Math.min(count, 5 - state.market.length);
  if (needed <= 0) return;
  const draw = state.drawPile.slice(0, needed);
  state.market.push(...draw);
  state.drawPile = state.drawPile.slice(draw.length);
}

function applyTakeCamels(state: GameState, playerIndex: number): void {
  const camelCards = state.market.filter((c) => c.good === "camel");
  if (camelCards.length === 0) throw new GameError("noCamelsInMarket");
  state.market = state.market.filter((c) => c.good !== "camel");
  state.players[playerIndex].camelCount += camelCards.length;
  refillMarket(state);
}

function applyTakeCard(state: GameState, playerIndex: number, marketCardID: string): void {
  const cardIndex = state.market.findIndex((c) => c.id === marketCardID);
  if (cardIndex === -1) throw new GameError("cardNotInMarket");
  const card = state.market[cardIndex];
  if (card.good === "camel") throw new GameError("cannotTakeCamelViaSingleTake");
  if (state.players[playerIndex].hand.length >= HAND_LIMIT) throw new GameError("handLimitExceeded");

  state.market.splice(cardIndex, 1);
  state.players[playerIndex].hand.push(card);
  refillMarket(state, 1);
}

function applyExchange(
  state: GameState,
  playerIndex: number,
  takenMarketCardIDs: string[],
  givenHandCardIDs: string[],
  givenCamelCount: number
): void {
  const takenCount = takenMarketCardIDs.length;
  const givenCount = givenHandCardIDs.length + givenCamelCount;
  if (takenCount < 2 || takenCount > 5) throw new GameError("exchangeCountOutOfRange");
  if (takenCount !== givenCount) throw new GameError("exchangeCountMismatch");
  if (new Set(takenMarketCardIDs).size !== takenCount) throw new GameError("exchangeCountMismatch");
  if (new Set(givenHandCardIDs).size !== givenHandCardIDs.length) throw new GameError("exchangeCountMismatch");
  if (state.players[playerIndex].camelCount < givenCamelCount) {
    throw new GameError("exchangeInsufficientCamelsInHerd");
  }

  const takenCards: Card[] = [];
  for (const id of takenMarketCardIDs) {
    const card = state.market.find((c) => c.id === id);
    if (!card) throw new GameError("cardNotInMarket");
    if (card.good === "camel") throw new GameError("exchangeCannotIncludeCamelFromMarket");
    takenCards.push(card);
  }

  const givenCards: Card[] = [];
  for (const id of givenHandCardIDs) {
    const card = state.players[playerIndex].hand.find((c) => c.id === id);
    if (!card) throw new GameError("cardNotInHand");
    givenCards.push(card);
  }

  const takenIDs = new Set(takenMarketCardIDs);
  const givenIDs = new Set(givenHandCardIDs);
  state.market = state.market.filter((c) => !takenIDs.has(c.id));
  state.players[playerIndex].hand = state.players[playerIndex].hand.filter((c) => !givenIDs.has(c.id));
  state.players[playerIndex].hand.push(...takenCards);
  state.players[playerIndex].camelCount -= givenCamelCount;

  state.market.push(...givenCards);
  for (let i = 0; i < givenCamelCount; i++) {
    state.market.push({ id: `camel-given-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2)}`, good: "camel" });
  }
}

function applySell(state: GameState, playerIndex: number, handCardIDs: string[]): void {
  if (handCardIDs.length === 0) throw new GameError("emptyAction");
  const cards: Card[] = [];
  for (const id of handCardIDs) {
    const card = state.players[playerIndex].hand.find((c) => c.id === id);
    if (!card) throw new GameError("cardNotInHand");
    cards.push(card);
  }
  const good = cards[0]?.good;
  if (!good || !cards.every((c) => c.good === good)) {
    throw new GameError("sellRequiresCardsOfSameGood");
  }
  const minimum = good === "diamond" || good === "gold" || good === "silver" ? 2 : 1;
  if (cards.length < minimum) throw new GameError("sellBelowMinimumForPreciousGood");

  const ids = new Set(handCardIDs);
  state.players[playerIndex].hand = state.players[playerIndex].hand.filter((c) => !ids.has(c.id));
  state.discard.push(...cards);

  const tokens = takeTokens(state.tokenBank, good, cards.length);
  const won = state.players[playerIndex].wonTokens[good] ?? [];
  state.players[playerIndex].wonTokens[good] = [...won, ...tokens];

  const bonus = drawBonus(state.bonusTokenBank, cards.length);
  if (bonus !== null) {
    state.players[playerIndex].wonBonusTokens.push(bonus);
  }
}

function evaluateRoundEnd(state: GameState): void {
  if (exhaustedStackCount(state.tokenBank) >= 3) {
    state.roundEndReason = "threeStacksExhausted";
  } else if (state.drawPile.length === 0 && state.market.length < 5) {
    state.roundEndReason = "deckExhausted";
  } else {
    return;
  }
  finishRound(state);
}

function finishRound(state: GameState): void {
  const [p0, p1] = state.players;

  let camelBonus0 = 0;
  let camelBonus1 = 0;
  if (p0.camelCount > p1.camelCount) camelBonus0 = 5;
  else if (p1.camelCount > p0.camelCount) camelBonus1 = 5;

  const result0: RoundResult = {
    playerID: p0.id,
    goodsValue: roundGoodsValue(p0),
    bonusValue: roundBonusValue(p0),
    camelBonus: camelBonus0
  };
  const result1: RoundResult = {
    playerID: p1.id,
    goodsValue: roundGoodsValue(p1),
    bonusValue: roundBonusValue(p1),
    camelBonus: camelBonus1
  };
  state.lastRoundResults = [result0, result1];

  const total0 = roundResultTotal(result0);
  const total1 = roundResultTotal(result1);
  if (total0 !== total1) {
    const winnerID = total0 > total1 ? p0.id : p1.id;
    const winner = findPlayer(state, winnerID);
    if (winner) {
      winner.roundsWon += 1;
      if (winner.roundsWon >= 2) {
        state.winnerID = winnerID;
      }
    }
  }
}
