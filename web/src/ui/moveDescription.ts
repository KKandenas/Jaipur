import { findPlayer, type Card, type GameAction, type GameState, type GoodType } from "../engine";

/**
 * Compound "good + kort" forms read oddly if built by just concatenating the
 * card label (e.g. "kryddorkort") - a tiny lookup keeps the wording natural
 * for all six sellable goods.
 */
const CARD_NOUN: Record<GoodType, string> = {
  camel: "kamelkort",
  diamond: "diamantkort",
  gold: "guldkort",
  silver: "silverkort",
  cloth: "tygkort",
  spice: "kryddkort",
  leather: "läderkort"
};

/** Matches the invariant, uncounted form already used in the rules text (e.g. "6 diamant, 8 tyg"). */
const GOOD_NOUN: Record<GoodType, string> = {
  camel: "kameler",
  diamond: "diamant",
  gold: "guld",
  silver: "silver",
  cloth: "tyg",
  spice: "kryddor",
  leather: "läder"
};

function findGood(cards: Card[], id: string): GoodType | undefined {
  return cards.find((c) => c.id === id)?.good;
}

/**
 * Describes a just-applied action in plain Swedish, for a toast shown to the
 * *other* player. Needs `priorState` (before the action) to look up which
 * good a taken/sold card was - by the time this runs client-side the card
 * has already moved out of the market/hand it came from.
 */
export function describeAction(action: GameAction, playerID: string, priorState: GameState): string {
  const name = findPlayer(priorState, playerID)?.displayName ?? "Motståndaren";

  switch (action.type) {
    case "takeCamels":
      return `${name} tog alla kameler`;
    case "takeCard": {
      const good = findGood(priorState.market, action.marketCardID);
      return good ? `${name} tog ett ${CARD_NOUN[good]}` : `${name} tog ett kort`;
    }
    case "exchange":
      return `${name} bytte ${action.takenMarketCardIDs.length} kort`;
    case "sell": {
      const player = findPlayer(priorState, playerID);
      const good = player ? findGood(player.hand, action.handCardIDs[0]) : undefined;
      return good ? `${name} sålde ${action.handCardIDs.length} ${GOOD_NOUN[good]}` : `${name} sålde kort`;
    }
  }
}
