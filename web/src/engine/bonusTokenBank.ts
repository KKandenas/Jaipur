import type { BonusTokenBank } from "./types";

/**
 * The three bonus-token stacks awarded when a player sells 3, 4, or 5+ cards
 * at once. 18 tokens total, confirmed against the physical game's component
 * list: 6 tokens per tier, two of each value (3-card: 1-3, 4-card: 4-6,
 * 5-card: 8-10).
 */
export function newBonusTokenBank(): BonusTokenBank {
  return {
    saleOfThree: [3, 3, 2, 2, 1, 1],
    saleOfFour: [6, 6, 5, 5, 4, 4],
    saleOfFiveOrMore: [10, 10, 9, 9, 8, 8]
  };
}

/**
 * Draws the next bonus token for selling `cardCount` cards at once, mutating
 * `bank` in place. Returns null for sales of fewer than 3 cards (no bonus
 * applies) or an exhausted stack.
 */
export function drawBonus(bank: BonusTokenBank, cardCount: number): number | null {
  if (cardCount < 3) return null;
  const key = cardCount === 3 ? "saleOfThree" : cardCount === 4 ? "saleOfFour" : "saleOfFiveOrMore";
  const stack = bank[key];
  if (stack.length === 0) return null;
  return stack.shift() ?? null;
}

export type BonusTier = "three" | "four" | "five";

/**
 * Which tier stack a won bonus token's value came from - the tiers use
 * non-overlapping value ranges (1-3 / 4-6 / 8-10) so this is unambiguous.
 * Which tier a token is from was never secret (you know how many cards you
 * sold); only the exact value within that tier is hidden until reveal.
 */
export function bonusTier(value: number): BonusTier {
  if (value <= 3) return "three";
  if (value <= 6) return "four";
  return "five";
}
