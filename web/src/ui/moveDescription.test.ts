import { describe, expect, it } from "vitest";
import { newGame } from "../engine/gameEngine";
import { describeAction } from "./moveDescription";

describe("describeAction", () => {
  it("describes taking all camels", () => {
    const state = newGame("p1", "Alice", "p2", "Bob");
    expect(describeAction({ type: "takeCamels" }, "p1", state)).toBe("Alice tog alla kameler");
  });

  it("describes taking a single market card by its good", () => {
    const state = newGame("p1", "Alice", "p2", "Bob");
    const card = state.market.find((c) => c.good !== "camel");
    if (!card) throw new Error("expected a non-camel market card");
    expect(describeAction({ type: "takeCard", marketCardID: card.id }, "p2", state)).toContain("Bob tog ett");
  });

  it("describes an exchange by card count", () => {
    const state = newGame("p1", "Alice", "p2", "Bob");
    expect(
      describeAction(
        { type: "exchange", takenMarketCardIDs: ["a", "b", "c"], givenHandCardIDs: ["d", "e"], givenCamelCount: 1 },
        "p1",
        state
      )
    ).toBe("Alice bytte 3 kort");
  });

  it("describes a sale by good and count", () => {
    const state = newGame("p1", "Alice", "p2", "Bob");
    state.players[0].hand = [
      { id: "x1", good: "gold" },
      { id: "x2", good: "gold" }
    ];
    expect(describeAction({ type: "sell", handCardIDs: ["x1", "x2"] }, "p1", state)).toBe("Alice sålde 2 guld");
  });
});
