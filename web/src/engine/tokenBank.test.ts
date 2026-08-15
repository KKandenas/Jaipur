import { describe, expect, it } from "vitest";
import { newTokenBank, takeTokens, remainingCount, exhaustedStackCount } from "./tokenBank";
import { newBonusTokenBank, drawBonus } from "./bonusTokenBank";
import { seededRandom } from "./rng";

describe("tokenBank", () => {
  it("dispenses tokens highest-value first", () => {
    const bank = newTokenBank();
    const taken = takeTokens(bank, "diamond", 2);
    expect(taken).toEqual([7, 7]);
    expect(remainingCount(bank, "diamond")).toBe(3);
  });

  it("returns fewer tokens than requested once a stack is short", () => {
    const bank = newTokenBank();
    takeTokens(bank, "diamond", 5);
    const taken = takeTokens(bank, "diamond", 3);
    expect(taken).toEqual([]);
    expect(remainingCount(bank, "diamond")).toBe(0);
  });

  it("counts exhausted stacks", () => {
    const bank = newTokenBank();
    expect(exhaustedStackCount(bank)).toBe(0);
    takeTokens(bank, "diamond", 5);
    takeTokens(bank, "gold", 5);
    expect(exhaustedStackCount(bank)).toBe(2);
    takeTokens(bank, "silver", 5);
    expect(exhaustedStackCount(bank)).toBe(3);
  });
});

describe("bonusTokenBank", () => {
  it("draws from the front of each sale-size stack and shares the 5+ stack for larger sales", () => {
    const bank = { saleOfThree: [3, 3, 2, 2, 1, 1], saleOfFour: [6, 6, 5, 5, 4, 4], saleOfFiveOrMore: [10, 10, 9, 9, 8, 8] };
    expect(drawBonus(bank, 3)).toBe(3);
    expect(drawBonus(bank, 4)).toBe(6);
    // saleOfFiveOrMore starts [10, 10, 9, 9, 8, 8] - selling 5 and selling 7
    // both draw from this same stack, so the second draw gets the second 10.
    expect(drawBonus(bank, 5)).toBe(10);
    expect(drawBonus(bank, 7)).toBe(10);
    expect(drawBonus(bank, 6)).toBe(9);
    expect(drawBonus(bank, 2)).toBeNull();
  });

  it("returns null once a stack is exhausted", () => {
    const bank = { saleOfThree: [3], saleOfFour: [], saleOfFiveOrMore: [] };
    expect(drawBonus(bank, 3)).toBe(3);
    expect(drawBonus(bank, 3)).toBeNull();
    expect(drawBonus(bank, 4)).toBeNull();
  });

  it("shuffles each stack - same multiset of values, but not always the same order", () => {
    const byValue = (a: number, b: number) => a - b;
    const bank = newBonusTokenBank(seededRandom(1));
    expect([...bank.saleOfThree].sort(byValue)).toEqual([1, 1, 2, 2, 3, 3]);
    expect([...bank.saleOfFour].sort(byValue)).toEqual([4, 4, 5, 5, 6, 6]);
    expect([...bank.saleOfFiveOrMore].sort(byValue)).toEqual([8, 8, 9, 9, 10, 10]);

    // Vanishingly unlikely for every one of many seeds to reproduce the
    // exact unshuffled order - if this ever fails, the shuffle broke.
    const seeds = Array.from({ length: 20 }, (_, i) => i);
    const allUnshuffled = seeds.every((seed) => {
      const b = newBonusTokenBank(seededRandom(seed));
      return (
        b.saleOfThree.join() === "3,3,2,2,1,1" &&
        b.saleOfFour.join() === "6,6,5,5,4,4" &&
        b.saleOfFiveOrMore.join() === "10,10,9,9,8,8"
      );
    });
    expect(allUnshuffled).toBe(false);
  });

  it("is reproducible for a given seed", () => {
    const a = newBonusTokenBank(seededRandom(7));
    const b = newBonusTokenBank(seededRandom(7));
    expect(a).toEqual(b);
  });
});
