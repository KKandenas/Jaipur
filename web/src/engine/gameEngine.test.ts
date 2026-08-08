import { describe, expect, it } from "vitest";
import { apply, newGame, startNextRound } from "./gameEngine";
import { seededRandom } from "./rng";
import { newTokenBank, takeTokens } from "./tokenBank";
import { GameError, newPlayer, type Card, type GameState, type RoundResult } from "./types";

function fixtureState(): GameState {
  const market: Card[] = [
    { id: "market-camel-1", good: "camel" },
    { id: "market-camel-2", good: "camel" },
    { id: "market-camel-3", good: "camel" },
    { id: "market-cloth-1", good: "cloth" },
    { id: "market-spice-1", good: "spice" }
  ];
  const drawPile: Card[] = Array.from({ length: 20 }, (_, i) => ({ id: `draw-${i}`, good: "leather" as const }));

  const alice = newPlayer("A", "Alice");
  alice.hand = [{ id: "a-gold-1", good: "gold" }];
  const bob = newPlayer("B", "Bob");
  bob.hand = [{ id: "b-gold-1", good: "gold" }];

  return {
    players: [alice, bob],
    market,
    drawPile,
    discard: [],
    tokenBank: newTokenBank(),
    bonusTokenBank: { saleOfThree: [3, 3, 2, 2, 2, 1, 1], saleOfFour: [6, 6, 5, 5, 4, 4], saleOfFiveOrMore: [10, 10, 9, 8, 8] },
    currentPlayerID: "A",
    roundNumber: 1,
    roundEndReason: null,
    lastRoundResults: [],
    winnerID: null
  };
}

describe("newGame", () => {
  it("deals 5 cards to each player (split between hand and herd) and seeds >=3 camels in the market", () => {
    const state = newGame("A", "Alice", "B", "Bob", seededRandom(1));
    expect(state.players[0].hand.length + state.players[0].camelCount).toBe(5);
    expect(state.players[1].hand.length + state.players[1].camelCount).toBe(5);
    expect(state.market).toHaveLength(5);
    expect(state.market.filter((c) => c.good === "camel").length).toBeGreaterThanOrEqual(3);
    expect(state.drawPile).toHaveLength(55 - 5 - 5 - 5);
    expect([state.players[0].id, state.players[1].id]).toContain(state.currentPlayerID);
  });

  it("never leaves a camel sitting in a starting hand - it always goes to the herd instead", () => {
    for (let seed = 0; seed < 30; seed++) {
      const state = newGame("A", "Alice", "B", "Bob", seededRandom(seed));
      expect(state.players[0].hand.some((c) => c.good === "camel")).toBe(false);
      expect(state.players[1].hand.some((c) => c.good === "camel")).toBe(false);
      expect(state.players[0].hand.length + state.players[0].camelCount).toBe(5);
      expect(state.players[1].hand.length + state.players[1].camelCount).toBe(5);
    }
  });

  it("always seeds at least 3 camels regardless of shuffle", () => {
    for (let seed = 0; seed < 20; seed++) {
      const state = newGame("A", "Alice", "B", "Bob", seededRandom(seed));
      expect(state.market.filter((c) => c.good === "camel").length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("take single card", () => {
  it("moves the card to hand and refills the market", () => {
    const state = fixtureState();
    const marketCard = state.market.find((c) => c.good !== "camel")!;
    const next = apply({ type: "takeCard", marketCardID: marketCard.id }, "A", state);
    expect(next.players[0].hand.some((c) => c.id === marketCard.id)).toBe(true);
    expect(next.market).toHaveLength(5);
    expect(next.currentPlayerID).toBe("B");
  });

  it("cannot take a camel via single take", () => {
    const state = fixtureState();
    const camel = state.market.find((c) => c.good === "camel")!;
    expect(() => apply({ type: "takeCard", marketCardID: camel.id }, "A", state)).toThrowError(
      expect.objectContaining({ code: "cannotTakeCamelViaSingleTake" })
    );
  });

  it("respects the hand limit", () => {
    const state = fixtureState();
    state.players[0].hand = Array.from({ length: 7 }, (_, i) => ({ id: `l${i}`, good: "leather" as const }));
    const marketCard = state.market.find((c) => c.good !== "camel")!;
    expect(() => apply({ type: "takeCard", marketCardID: marketCard.id }, "A", state)).toThrowError(
      expect.objectContaining({ code: "handLimitExceeded" })
    );
  });
});

describe("take camels", () => {
  it("moves all camels to the herd and refills the market", () => {
    const state = fixtureState();
    const camelCount = state.market.filter((c) => c.good === "camel").length;
    const next = apply({ type: "takeCamels" }, "A", state);
    expect(next.players[0].camelCount).toBe(camelCount);
    expect(next.market.filter((c) => c.good === "camel")).toHaveLength(0);
    expect(next.market).toHaveLength(5);
  });

  it("fails when the market has no camels", () => {
    const state = fixtureState();
    state.market = state.market.map((c) => (c.good === "camel" ? { id: c.id, good: "leather" as const } : c));
    expect(() => apply({ type: "takeCamels" }, "A", state)).toThrowError(expect.objectContaining({ code: "noCamelsInMarket" }));
  });
});

describe("exchange", () => {
  it("swaps cards and camels between hand/herd and market", () => {
    const state = fixtureState();
    state.market = [
      { id: "m1", good: "cloth" },
      { id: "m2", good: "spice" },
      { id: "camel1", good: "camel" },
      { id: "camel2", good: "camel" },
      { id: "camel3", good: "camel" }
    ];
    state.players[0].hand = [
      { id: "h1", good: "leather" },
      { id: "h2", good: "diamond" }
    ];
    state.players[0].camelCount = 1;

    const next = apply(
      { type: "exchange", takenMarketCardIDs: ["m1", "m2"], givenHandCardIDs: ["h1"], givenCamelCount: 1 },
      "A",
      state
    );
    expect(new Set(next.players[0].hand.map((c) => c.id))).toEqual(new Set(["h2", "m1", "m2"]));
    expect(next.players[0].camelCount).toBe(0);
    expect(next.market.some((c) => c.id === "h1")).toBe(true);
    expect(next.market.filter((c) => c.good === "camel")).toHaveLength(4); // 3 untouched + 1 given back from herd
    expect(next.market).toHaveLength(5);
  });

  it("cannot take a camel from the market as part of an exchange", () => {
    const state = fixtureState();
    const camel = state.market.find((c) => c.good === "camel")!;
    const other = state.market.find((c) => c.good !== "camel")!;
    state.players[0].hand = [
      { id: "h1", good: "leather" },
      { id: "h2", good: "diamond" }
    ];
    expect(() =>
      apply(
        { type: "exchange", takenMarketCardIDs: [camel.id, other.id], givenHandCardIDs: ["h1", "h2"], givenCamelCount: 0 },
        "A",
        state
      )
    ).toThrowError(expect.objectContaining({ code: "exchangeCannotIncludeCamelFromMarket" }));
  });

  it("requires taken and given counts to match", () => {
    const state = fixtureState();
    state.players[0].hand = [{ id: "h1", good: "leather" }];
    const two = state.market.filter((c) => c.good !== "camel").slice(0, 2).map((c) => c.id);
    expect(() =>
      apply({ type: "exchange", takenMarketCardIDs: two, givenHandCardIDs: ["h1"], givenCamelCount: 0 }, "A", state)
    ).toThrowError(expect.objectContaining({ code: "exchangeCountMismatch" }));
  });

  it("requires 2-5 cards", () => {
    const state = fixtureState();
    state.players[0].hand = [{ id: "h1", good: "leather" }];
    const one = [state.market.find((c) => c.good !== "camel")!.id];
    expect(() =>
      apply({ type: "exchange", takenMarketCardIDs: one, givenHandCardIDs: ["h1"], givenCamelCount: 0 }, "A", state)
    ).toThrowError(expect.objectContaining({ code: "exchangeCountOutOfRange" }));
  });
});

describe("sell", () => {
  it("requires at least 2 cards for a precious good", () => {
    const state = fixtureState();
    state.players[0].hand = [{ id: "d1", good: "diamond" }];
    expect(() => apply({ type: "sell", handCardIDs: ["d1"] }, "A", state)).toThrowError(
      expect.objectContaining({ code: "sellBelowMinimumForPreciousGood" })
    );
  });

  it("allows a single card for a regular good", () => {
    const state = fixtureState();
    state.players[0].hand = [{ id: "l1", good: "leather" }];
    const next = apply({ type: "sell", handCardIDs: ["l1"] }, "A", state);
    expect(next.players[0].wonTokens.leather).toEqual([4]);
    expect(next.players[0].hand).toHaveLength(0);
  });

  it("requires all sold cards to share a good", () => {
    const state = fixtureState();
    state.players[0].hand = [
      { id: "l1", good: "leather" },
      { id: "s1", good: "spice" }
    ];
    expect(() => apply({ type: "sell", handCardIDs: ["l1", "s1"] }, "A", state)).toThrowError(
      expect.objectContaining({ code: "sellRequiresCardsOfSameGood" })
    );
  });

  it("awards a bonus token for selling three at once", () => {
    const state = fixtureState();
    state.players[0].hand = [
      { id: "s1", good: "spice" },
      { id: "s2", good: "spice" },
      { id: "s3", good: "spice" }
    ];
    const next = apply({ type: "sell", handCardIDs: ["s1", "s2", "s3"] }, "A", state);
    expect(next.players[0].wonTokens.spice).toEqual([5, 3, 3]);
    expect(next.players[0].wonBonusTokens).toEqual([3]);
  });

  it("does not change the market", () => {
    const state = fixtureState();
    state.players[0].hand = [{ id: "l1", good: "leather" }];
    const marketBefore = [...state.market];
    const next = apply({ type: "sell", handCardIDs: ["l1"] }, "A", state);
    expect(new Set(next.market.map((c) => c.id))).toEqual(new Set(marketBefore.map((c) => c.id)));
  });
});

describe("turn ownership", () => {
  it("rejects a move from the player who is not up", () => {
    const state = fixtureState();
    const card = state.market.find((c) => c.good !== "camel")!;
    expect(() => apply({ type: "takeCard", marketCardID: card.id }, "B", state)).toThrowError(
      expect.objectContaining({ code: "notYourTurn" })
    );
  });
});

describe("round end", () => {
  it("ends the round once three token stacks are exhausted", () => {
    const state = fixtureState();
    takeTokens(state.tokenBank, "diamond", 5);
    takeTokens(state.tokenBank, "gold", 6);
    takeTokens(state.tokenBank, "silver", 5); // leaves 1 silver token
    state.players[0].hand = [
      { id: "s1", good: "silver" },
      { id: "s2", good: "silver" }
    ];

    const next = apply({ type: "sell", handCardIDs: ["s1", "s2"] }, "A", state);
    expect(next.roundEndReason).toBe("threeStacksExhausted");
    expect(next.lastRoundResults).toHaveLength(2);
  });

  it("ends the round when the draw pile can't refill the market", () => {
    const state = fixtureState();
    state.drawPile = [];
    state.market = [{ id: "only", good: "leather" }];
    const next = apply({ type: "takeCard", marketCardID: "only" }, "A", state);
    expect(next.roundEndReason).toBe("deckExhausted");
  });

  it("awards the camel bonus to whoever has more camels", () => {
    const state = fixtureState();
    state.players[0].camelCount = 5;
    state.players[1].camelCount = 2;
    takeTokens(state.tokenBank, "diamond", 5);
    takeTokens(state.tokenBank, "gold", 6);
    takeTokens(state.tokenBank, "silver", 5);
    state.players[0].hand = [
      { id: "s1", good: "silver" },
      { id: "s2", good: "silver" }
    ];

    const next = apply({ type: "sell", handCardIDs: ["s1", "s2"] }, "A", state);
    const aliceResult = next.lastRoundResults.find((r: RoundResult) => r.playerID === "A")!;
    expect(aliceResult.camelBonus).toBe(5);
  });

  it("ends the game after a second round win", () => {
    const state = fixtureState();
    state.players[0].roundsWon = 1;
    takeTokens(state.tokenBank, "diamond", 5);
    takeTokens(state.tokenBank, "gold", 6);
    takeTokens(state.tokenBank, "silver", 5);
    state.players[0].hand = [
      { id: "s1", good: "silver" },
      { id: "s2", good: "silver" }
    ];

    const next = apply({ type: "sell", handCardIDs: ["s1", "s2"] }, "A", state);
    expect(next.players[0].roundsWon).toBe(2);
    expect(next.winnerID).toBe("A");
  });

  it("rejects any action once the game is over", () => {
    const state = fixtureState();
    state.winnerID = "A";
    const card = state.market.find((c) => c.good !== "camel")!;
    expect(() => apply({ type: "takeCard", marketCardID: card.id }, "A", state)).toThrowError(
      expect.objectContaining({ code: "gameAlreadyOver" })
    );
  });
});

describe("startNextRound", () => {
  it("resets the board but keeps roundsWon, and the previous loser opens", () => {
    const state = fixtureState();
    state.players[0].roundsWon = 1;
    state.players[0].camelCount = 4;
    state.players[0].wonTokens = { leather: [4, 3] };
    state.lastRoundResults = [
      { playerID: "A", goodsValue: 7, bonusValue: 0, camelBonus: 0 },
      { playerID: "B", goodsValue: 3, bonusValue: 0, camelBonus: 0 }
    ];

    const next = startNextRound(state, seededRandom(42));
    expect(next.roundNumber).toBe(state.roundNumber + 1);
    expect(next.players[0].roundsWon).toBe(1);
    expect(Object.keys(next.players[0].wonTokens)).toHaveLength(0);
    // The old herd/hand are wiped and re-dealt fresh - any camel among the
    // new deal goes straight to the herd, never into the hand.
    expect(next.players[0].hand.some((c) => c.good === "camel")).toBe(false);
    expect(next.players[1].hand.some((c) => c.good === "camel")).toBe(false);
    expect(next.players[0].hand.length + next.players[0].camelCount).toBe(5);
    expect(next.players[1].hand.length + next.players[1].camelCount).toBe(5);
    expect(next.currentPlayerID).toBe("B");
  });
});

describe("GameError", () => {
  it("is thrown as a proper Error instance with a code", () => {
    const state = fixtureState();
    try {
      apply({ type: "takeCard", marketCardID: "nope" }, "A", state);
      expect.fail("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GameError);
      expect((error as GameError).code).toBe("cardNotInMarket");
    }
  });
});
