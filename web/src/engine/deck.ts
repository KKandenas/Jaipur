import { ALL_GOODS, deckCount, type Card } from "./types";

let idCounter = 0;
function uniqueSuffix(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter}`;
}

/**
 * Builds the full 55-card Jaipur deck (unshuffled).
 * Composition: 6 diamond, 6 gold, 6 silver, 8 cloth, 8 spice, 10 leather, 11 camel.
 */
export function freshCards(): Card[] {
  const cards: Card[] = [];
  for (const good of ALL_GOODS) {
    for (let i = 0; i < deckCount(good); i++) {
      cards.push({ id: `${good}-${i}-${uniqueSuffix()}`, good });
    }
  }
  return cards;
}

export const TOTAL_CARD_COUNT = ALL_GOODS.reduce((sum, good) => sum + deckCount(good), 0);
