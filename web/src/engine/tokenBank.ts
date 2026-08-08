import { SELLABLE_GOODS, type GoodType, type TokenBank } from "./types";

/**
 * NOTE: this table follows the widely published Jaipur player-aid values and
 * is internally consistent with the official deck composition (55 cards:
 * 6/6/6/8/8/10/11). It could not be confirmed byte-for-byte against the
 * publisher's own rulebook in the environment this was written in - double
 * check against your physical rulebook/insert before relying on it for real
 * scoring.
 */
export const DEFAULT_TOKEN_STACKS: Record<GoodType, number[]> = {
  camel: [],
  diamond: [7, 7, 5, 5, 5],
  gold: [6, 6, 6, 5, 5, 5],
  silver: [5, 5, 5, 5, 5, 5],
  cloth: [5, 3, 3, 2, 2, 1, 1, 1],
  spice: [5, 3, 3, 2, 2, 1, 1, 1],
  leather: [4, 3, 2, 1, 1, 1, 1, 1, 1, 1]
};

export function newTokenBank(): TokenBank {
  const stacks = {} as Record<GoodType, number[]>;
  for (const good of Object.keys(DEFAULT_TOKEN_STACKS) as GoodType[]) {
    stacks[good] = [...DEFAULT_TOKEN_STACKS[good]];
  }
  return { stacks };
}

export function remainingCount(bank: TokenBank, good: GoodType): number {
  return bank.stacks[good]?.length ?? 0;
}

/** Number of good types whose stack is fully depleted. The round ends once this reaches 3. */
export function exhaustedStackCount(bank: TokenBank): number {
  return SELLABLE_GOODS.filter((good) => remainingCount(bank, good) === 0).length;
}

/**
 * Removes and returns up to `count` tokens from the top of `good`'s stack,
 * mutating `bank` in place. Returns fewer than `count` values if the stack
 * runs out early.
 */
export function takeTokens(bank: TokenBank, good: GoodType, count: number): number[] {
  if (count <= 0) return [];
  const stack = bank.stacks[good] ?? [];
  const taken = stack.slice(0, count);
  bank.stacks[good] = stack.slice(taken.length);
  return taken;
}
