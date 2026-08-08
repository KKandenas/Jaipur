import { describe, expect, it } from "vitest";
import { newTokenBank, takeTokens, remainingCount, exhaustedStackCount } from "./tokenBank";
import { newBonusTokenBank, drawBonus } from "./bonusTokenBank";

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
  it("draws highest-first per sale size and shares the 5+ stack for larger sales", () => {
    const bank = newBonusTokenBank();
    expect(drawBonus(bank, 3)).toBe(3);
    expect(drawBonus(bank, 4)).toBe(6);
    // saleOfFiveOrMore starts [10, 10, 9, 8, 8] - selling 5 and selling 7 both
    // draw from this same stack, so the second draw gets the second 10.
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
});
