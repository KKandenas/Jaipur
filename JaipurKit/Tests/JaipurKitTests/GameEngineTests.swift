import XCTest
@testable import JaipurKit

final class GameEngineTests: XCTestCase {

    // MARK: - Setup

    func testNewGameDealsFiveAndFive() {
        let rng = SeededGenerator(seed: 1)
        let state = GameEngine.newGame(playerID1: "A", playerName1: "Alice", playerID2: "B", playerName2: "Bob", rng: rng)
        XCTAssertEqual(state.players[0].hand.count + state.players[0].camelCount, 5)
        XCTAssertEqual(state.players[1].hand.count + state.players[1].camelCount, 5)
        XCTAssertEqual(state.market.count, 5)
        XCTAssertGreaterThanOrEqual(state.market.filter { $0.good == .camel }.count, 3)
        XCTAssertEqual(state.drawPile.count, 55 - 5 - 5 - 5)
        XCTAssertTrue(state.players.map(\.id).contains(state.currentPlayerID))
    }

    func testMarketAlwaysSeededWithAtLeastThreeCamels() {
        for seed: UInt64 in 0..<20 {
            let rng = SeededGenerator(seed: seed)
            let state = GameEngine.newGame(playerID1: "A", playerName1: "Alice", playerID2: "B", playerName2: "Bob", rng: rng)
            XCTAssertGreaterThanOrEqual(state.market.filter { $0.good == .camel }.count, 3, "seed \(seed)")
        }
    }

    func testStartingHandNeverContainsACamel() {
        for seed: UInt64 in 0..<30 {
            let rng = SeededGenerator(seed: seed)
            let state = GameEngine.newGame(playerID1: "A", playerName1: "Alice", playerID2: "B", playerName2: "Bob", rng: rng)
            XCTAssertFalse(state.players[0].hand.contains { $0.good == .camel }, "seed \(seed)")
            XCTAssertFalse(state.players[1].hand.contains { $0.good == .camel }, "seed \(seed)")
            XCTAssertEqual(state.players[0].hand.count + state.players[0].camelCount, 5, "seed \(seed)")
            XCTAssertEqual(state.players[1].hand.count + state.players[1].camelCount, 5, "seed \(seed)")
        }
    }

    // MARK: - Take single card

    func testTakeSingleCardMovesCardAndRefillsMarket() throws {
        var state = makeFixtureState()
        let marketCard = state.market.first { $0.good != .camel }!
        let next = try GameEngine.apply(.takeCard(marketCardID: marketCard.id), by: "A", to: state)
        XCTAssertTrue(next.players[0].hand.contains { $0.id == marketCard.id })
        XCTAssertEqual(next.market.count, 5)
        XCTAssertEqual(next.currentPlayerID, "B")
        state = next
    }

    func testCannotTakeCamelViaSingleTake() throws {
        let state = makeFixtureState()
        let camel = state.market.first { $0.good == .camel }!
        XCTAssertThrowsError(try GameEngine.apply(.takeCard(marketCardID: camel.id), by: "A", to: state)) { error in
            XCTAssertEqual(error as? GameError, .cannotTakeCamelViaSingleTake)
        }
    }

    func testTakeCardRespectsHandLimit() throws {
        var state = makeFixtureState()
        state.players[0].hand = (0..<7).map { _ in Card(good: .leather) }
        let marketCard = state.market.first { $0.good != .camel }!
        XCTAssertThrowsError(try GameEngine.apply(.takeCard(marketCardID: marketCard.id), by: "A", to: state)) { error in
            XCTAssertEqual(error as? GameError, .handLimitExceeded)
        }
    }

    // MARK: - Take camels

    func testTakeCamelsMovesAllCamelsToHerd() throws {
        let state = makeFixtureState()
        let camelCount = state.market.filter { $0.good == .camel }.count
        let next = try GameEngine.apply(.takeCamels, by: "A", to: state)
        XCTAssertEqual(next.players[0].camelCount, camelCount)
        XCTAssertEqual(next.market.filter { $0.good == .camel }.count, 0)
        XCTAssertEqual(next.market.count, 5)
    }

    func testTakeCamelsFailsWhenMarketHasNone() throws {
        var state = makeFixtureState()
        state.market = state.market.map { $0.good == .camel ? Card(good: .leather) : $0 }
        XCTAssertThrowsError(try GameEngine.apply(.takeCamels, by: "A", to: state)) { error in
            XCTAssertEqual(error as? GameError, .noCamelsInMarket)
        }
    }

    // MARK: - Exchange

    func testExchangeSwapsCardsAndCamels() throws {
        var state = makeFixtureState()
        state.market = [
            Card(id: "m1", good: .cloth),
            Card(id: "m2", good: .spice),
            Card(id: "camel1", good: .camel),
            Card(id: "camel2", good: .camel),
            Card(id: "camel3", good: .camel)
        ]
        state.players[0].hand = [Card(id: "h1", good: .leather), Card(id: "h2", good: .diamond)]
        state.players[0].camelCount = 1

        let next = try GameEngine.apply(
            .exchange(takenMarketCardIDs: ["m1", "m2"], givenHandCardIDs: ["h1"], givenCamelCount: 1),
            by: "A",
            to: state
        )
        XCTAssertEqual(Set(next.players[0].hand.map(\.id)), ["h2", "m1", "m2"])
        XCTAssertEqual(next.players[0].camelCount, 0)
        XCTAssertTrue(next.market.contains { $0.id == "h1" })
        XCTAssertEqual(next.market.filter { $0.good == .camel }.count, 4) // 3 untouched + 1 given back from herd
        XCTAssertEqual(next.market.count, 5)
    }

    func testExchangeCannotTakeCamelFromMarket() throws {
        var state = makeFixtureState()
        let camel = state.market.first { $0.good == .camel }!
        let other = state.market.first { $0.good != .camel }!
        state.players[0].hand = [Card(id: "h1", good: .leather), Card(id: "h2", good: .diamond)]
        XCTAssertThrowsError(try GameEngine.apply(
            .exchange(takenMarketCardIDs: [camel.id, other.id], givenHandCardIDs: ["h1", "h2"], givenCamelCount: 0),
            by: "A", to: state
        )) { error in
            XCTAssertEqual(error as? GameError, .exchangeCannotIncludeCamelFromMarket)
        }
    }

    func testExchangeCountMustMatch() throws {
        var state = makeFixtureState()
        state.players[0].hand = [Card(id: "h1", good: .leather)]
        let two = Array(state.market.filter { $0.good != .camel }.prefix(2)).map(\.id)
        XCTAssertThrowsError(try GameEngine.apply(
            .exchange(takenMarketCardIDs: two, givenHandCardIDs: ["h1"], givenCamelCount: 0),
            by: "A", to: state
        )) { error in
            XCTAssertEqual(error as? GameError, .exchangeCountMismatch)
        }
    }

    func testExchangeOutOfRangeCount() throws {
        var state = makeFixtureState()
        state.players[0].hand = [Card(id: "h1", good: .leather)]
        let one = [state.market.first { $0.good != .camel }!.id]
        XCTAssertThrowsError(try GameEngine.apply(
            .exchange(takenMarketCardIDs: one, givenHandCardIDs: ["h1"], givenCamelCount: 0),
            by: "A", to: state
        )) { error in
            XCTAssertEqual(error as? GameError, .exchangeCountOutOfRange)
        }
    }

    // MARK: - Sell

    func testSellPreciousGoodRequiresMinimumTwo() throws {
        var state = makeFixtureState()
        state.players[0].hand = [Card(id: "d1", good: .diamond)]
        XCTAssertThrowsError(try GameEngine.apply(.sell(handCardIDs: ["d1"]), by: "A", to: state)) { error in
            XCTAssertEqual(error as? GameError, .sellBelowMinimumForPreciousGood)
        }
    }

    func testSellRegularGoodAllowsSingleCard() throws {
        var state = makeFixtureState()
        state.players[0].hand = [Card(id: "l1", good: .leather)]
        let next = try GameEngine.apply(.sell(handCardIDs: ["l1"]), by: "A", to: state)
        XCTAssertEqual(next.players[0].wonTokens[.leather], [4])
        XCTAssertTrue(next.players[0].hand.isEmpty)
    }

    func testSellMustBeSameGood() throws {
        var state = makeFixtureState()
        state.players[0].hand = [Card(id: "l1", good: .leather), Card(id: "s1", good: .spice)]
        XCTAssertThrowsError(try GameEngine.apply(.sell(handCardIDs: ["l1", "s1"]), by: "A", to: state)) { error in
            XCTAssertEqual(error as? GameError, .sellRequiresCardsOfSameGood)
        }
    }

    func testSellingThreeAwardsBonusToken() throws {
        var state = makeFixtureState()
        state.players[0].hand = [Card(id: "s1", good: .spice), Card(id: "s2", good: .spice), Card(id: "s3", good: .spice)]
        let next = try GameEngine.apply(.sell(handCardIDs: ["s1", "s2", "s3"]), by: "A", to: state)
        XCTAssertEqual(next.players[0].wonTokens[.spice], [5, 3, 3])
        XCTAssertEqual(next.players[0].wonBonusTokens, [3])
    }

    func testSellDoesNotChangeMarketOrTurnRefill() throws {
        var state = makeFixtureState()
        state.players[0].hand = [Card(id: "l1", good: .leather)]
        let marketBefore = state.market
        let next = try GameEngine.apply(.sell(handCardIDs: ["l1"]), by: "A", to: state)
        XCTAssertEqual(Set(next.market.map(\.id)), Set(marketBefore.map(\.id)))
    }

    // MARK: - Turn ownership

    func testNotYourTurnThrows() throws {
        let state = makeFixtureState()
        let card = state.market.first { $0.good != .camel }!
        XCTAssertThrowsError(try GameEngine.apply(.takeCard(marketCardID: card.id), by: "B", to: state)) { error in
            XCTAssertEqual(error as? GameError, .notYourTurn)
        }
    }

    // MARK: - Round end

    func testRoundEndsWhenThreeStacksExhausted() throws {
        var state = makeFixtureState()
        var bank = TokenBank()
        _ = bank.takeTokens(for: .diamond, count: 5)
        _ = bank.takeTokens(for: .gold, count: 5)
        _ = bank.takeTokens(for: .silver, count: 4) // leave 1 silver token
        state.tokenBank = bank
        state.players[0].hand = [Card(id: "s1", good: .silver), Card(id: "s2", good: .silver)]

        let next = try GameEngine.apply(.sell(handCardIDs: ["s1", "s2"]), by: "A", to: state)
        XCTAssertEqual(next.roundEndReason, .threeStacksExhausted)
        XCTAssertEqual(next.lastRoundResults.count, 2)
    }

    func testRoundEndsWhenDeckCannotRefillMarket() throws {
        var state = makeFixtureState()
        state.drawPile = []
        state.market = [Card(id: "only", good: .leather)]
        let next = try GameEngine.apply(.takeCard(marketCardID: "only"), by: "A", to: state)
        XCTAssertEqual(next.roundEndReason, .deckExhausted)
    }

    func testCamelBonusAwardedToPlayerWithMoreCamels() throws {
        var state = makeFixtureState()
        state.players[0].camelCount = 5
        state.players[1].camelCount = 2
        var bank = TokenBank()
        _ = bank.takeTokens(for: .diamond, count: 5)
        _ = bank.takeTokens(for: .gold, count: 5)
        _ = bank.takeTokens(for: .silver, count: 4) // leave 1 silver token
        state.tokenBank = bank
        state.players[0].hand = [Card(id: "s1", good: .silver), Card(id: "s2", good: .silver)]

        let next = try GameEngine.apply(.sell(handCardIDs: ["s1", "s2"]), by: "A", to: state)
        let aliceResult = next.lastRoundResults.first { $0.playerID == "A" }!
        XCTAssertEqual(aliceResult.camelBonus, 5)
    }

    func testGameEndsAfterSecondRoundWin() throws {
        var state = makeFixtureState()
        state.players[0].roundsWon = 1
        var bank = TokenBank()
        _ = bank.takeTokens(for: .diamond, count: 5)
        _ = bank.takeTokens(for: .gold, count: 5)
        _ = bank.takeTokens(for: .silver, count: 4) // leave 1 silver token
        state.tokenBank = bank
        state.players[0].hand = [Card(id: "s1", good: .silver), Card(id: "s2", good: .silver)]

        let next = try GameEngine.apply(.sell(handCardIDs: ["s1", "s2"]), by: "A", to: state)
        XCTAssertEqual(next.players[0].roundsWon, 2)
        XCTAssertEqual(next.winnerID, "A")
        XCTAssertTrue(next.isGameOver)
    }

    func testActionAfterGameOverThrows() throws {
        var state = makeFixtureState()
        state.winnerID = "A"
        let card = state.market.first { $0.good != .camel }!
        XCTAssertThrowsError(try GameEngine.apply(.takeCard(marketCardID: card.id), by: "A", to: state)) { error in
            XCTAssertEqual(error as? GameError, .gameAlreadyOver)
        }
    }

    // MARK: - Next round

    func testStartNextRoundResetsBoardButKeepsRoundsWon() {
        var state = makeFixtureState()
        state.players[0].roundsWon = 1
        state.players[0].camelCount = 4
        state.players[0].wonTokens = [.leather: [4, 3]]
        state.lastRoundResults = [
            RoundResult(playerID: "A", goodsValue: 7, bonusValue: 0, camelBonus: 0),
            RoundResult(playerID: "B", goodsValue: 3, bonusValue: 0, camelBonus: 0)
        ]

        let next = GameEngine.startNextRound(from: state, rng: SeededGenerator(seed: 42))
        XCTAssertEqual(next.roundNumber, state.roundNumber + 1)
        XCTAssertEqual(next.players[0].roundsWon, 1)
        XCTAssertTrue(next.players[0].wonTokens.isEmpty)
        // The old herd/hand are wiped and re-dealt fresh - any camel among the
        // new deal goes straight to the herd, never into the hand.
        XCTAssertFalse(next.players[0].hand.contains { $0.good == .camel })
        XCTAssertFalse(next.players[1].hand.contains { $0.good == .camel })
        XCTAssertEqual(next.players[0].hand.count + next.players[0].camelCount, 5)
        XCTAssertEqual(next.players[1].hand.count + next.players[1].camelCount, 5)
        // Loser of the previous round (B, lower total) should open the next round.
        XCTAssertEqual(next.currentPlayerID, "B")
    }

    func testStartNextRoundResetsRevealedBonusTokenIndices() {
        var state = makeFixtureState()
        state.players[0].wonBonusTokens = [3, 6]
        state.players[0].revealedBonusTokenIndices = [0]

        let next = GameEngine.startNextRound(from: state, rng: SeededGenerator(seed: 42))
        XCTAssertEqual(next.players[0].wonBonusTokens, [])
        XCTAssertEqual(next.players[0].revealedBonusTokenIndices, [])
    }

    // MARK: - Bonus token reveal

    func testRevealBonusTokenFlipsItAndIsIdempotent() {
        var state = makeFixtureState()
        state.players[0].wonBonusTokens = [3, 6, 10]

        let next = GameEngine.revealBonusToken("A", tokenIndex: 1, in: state)
        XCTAssertEqual(next.players[0].revealedBonusTokenIndices, [1])

        let next2 = GameEngine.revealBonusToken("A", tokenIndex: 1, in: next)
        XCTAssertEqual(next2.players[0].revealedBonusTokenIndices, [1])
    }

    func testRevealBonusTokenIsNotGatedByTurnOrRoundOrGameOver() {
        var state = makeFixtureState()
        state.players[0].wonBonusTokens = [3]
        state.players[1].wonBonusTokens = [6]
        state.currentPlayerID = "A"
        state.roundEndReason = .threeStacksExhausted
        state.winnerID = "B"

        // Player A can still flip player B's token, even though it's not a
        // normal move and the match is already over.
        let next = GameEngine.revealBonusToken("B", tokenIndex: 0, in: state)
        XCTAssertEqual(next.players[1].revealedBonusTokenIndices, [0])
    }

    func testRevealBonusTokenIgnoresOutOfRangeIndexOrUnknownPlayer() {
        var state = makeFixtureState()
        state.players[0].wonBonusTokens = [3]

        XCTAssertEqual(GameEngine.revealBonusToken("A", tokenIndex: 5, in: state).players[0].revealedBonusTokenIndices, [])
        XCTAssertEqual(GameEngine.revealBonusToken("nobody", tokenIndex: 0, in: state), state)
    }

    // MARK: - Fixtures

    /// A hand-assembled, deterministic mid-game state useful for exercising single actions
    /// without depending on a real shuffle.
    private func makeFixtureState() -> GameState {
        let market = [
            Card(id: "market-camel-1", good: .camel),
            Card(id: "market-camel-2", good: .camel),
            Card(id: "market-camel-3", good: .camel),
            Card(id: "market-cloth-1", good: .cloth),
            Card(id: "market-spice-1", good: .spice)
        ]
        var drawPile: [Card] = []
        for i in 0..<20 {
            drawPile.append(Card(id: "draw-\(i)", good: .leather))
        }
        let players = [
            Player(id: "A", displayName: "Alice", hand: [Card(id: "a-gold-1", good: .gold)]),
            Player(id: "B", displayName: "Bob", hand: [Card(id: "b-gold-1", good: .gold)])
        ]
        return GameState(players: players, market: market, drawPile: drawPile, currentPlayerID: "A")
    }
}
