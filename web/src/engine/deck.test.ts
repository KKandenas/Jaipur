import { describe, expect, it } from "vitest";
import { freshCards, TOTAL_CARD_COUNT } from "./deck";

describe("deck", () => {
  it("has the correct composition", () => {
    const cards = freshCards();
    expect(cards).toHaveLength(55);
    expect(cards.filter((c) => c.good === "camel")).toHaveLength(11);
    expect(cards.filter((c) => c.good === "diamond")).toHaveLength(6);
    expect(cards.filter((c) => c.good === "gold")).toHaveLength(6);
    expect(cards.filter((c) => c.good === "silver")).toHaveLength(6);
    expect(cards.filter((c) => c.good === "cloth")).toHaveLength(8);
    expect(cards.filter((c) => c.good === "spice")).toHaveLength(8);
    expect(cards.filter((c) => c.good === "leather")).toHaveLength(10);
    expect(TOTAL_CARD_COUNT).toBe(55);
  });

  it("gives every card a unique id", () => {
    const cards = freshCards();
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
  });
});
