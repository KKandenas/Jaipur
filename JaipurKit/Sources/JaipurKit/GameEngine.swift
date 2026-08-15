import Foundation

/// Pure, deterministic Jaipur rules engine. `GameState` is a value type and every
/// mutation goes through `GameEngine.apply`, which validates the action and returns
/// the resulting state (or throws a `GameError`). This makes the engine trivial to
/// unit test and safe to run inside a Firestore transaction (read state, apply,
/// write state) without any hidden mutable global state.
public enum GameEngine {

    // MARK: - Setup

    /// Deals a brand-new game: shuffles the deck, seeds the market with 3 camels
    /// + 2 random cards, and deals 5 cards to each player.
    public static func newGame(
        playerID1: String,
        playerName1: String,
        playerID2: String,
        playerName2: String,
        rng: RandomNumberGenerator = SystemRandomNumberGenerator()
    ) -> GameState {
        var rng = rng
        var players = [
            Player(id: playerID1, displayName: playerName1),
            Player(id: playerID2, displayName: playerName2)
        ]
        let (market, drawPile) = dealMarketAndDrawPile(rng: &rng)

        var remaining = drawPile
        let deal0 = dealStartingHand(&remaining)
        players[0].hand = deal0.hand
        players[0].camelCount = deal0.camelCount
        let deal1 = dealStartingHand(&remaining)
        players[1].hand = deal1.hand
        players[1].camelCount = deal1.camelCount

        let startingPlayer = Bool.random(using: &rng) ? playerID1 : playerID2

        return GameState(
            players: players,
            market: market,
            drawPile: remaining,
            bonusTokenBank: BonusTokenBank.shuffled(using: &rng),
            currentPlayerID: startingPlayer,
            roundNumber: 1
        )
    }

    /// Resets the board for a new round while keeping each player's `roundsWon` tally.
    public static func startNextRound(
        from state: GameState,
        rng: RandomNumberGenerator = SystemRandomNumberGenerator()
    ) -> GameState {
        var rng = rng
        var players = state.players.map { player -> Player in
            var reset = player
            reset.hand = []
            reset.camelCount = 0
            reset.wonTokens = [:]
            reset.wonBonusTokens = []
            reset.revealedBonusTokenIndices = []
            return reset
        }
        let (market, drawPile) = dealMarketAndDrawPile(rng: &rng)
        var remaining = drawPile
        let deal0 = dealStartingHand(&remaining)
        players[0].hand = deal0.hand
        players[0].camelCount = deal0.camelCount
        let deal1 = dealStartingHand(&remaining)
        players[1].hand = deal1.hand
        players[1].camelCount = deal1.camelCount

        let starter = nextRoundStarter(state)

        return GameState(
            players: players,
            market: market,
            drawPile: remaining,
            tokenBank: TokenBank(),
            bonusTokenBank: BonusTokenBank.shuffled(using: &rng),
            currentPlayerID: starter,
            roundNumber: state.roundNumber + 1
        )
    }

    /// House rule: the player who scored lower in the previous round opens the next
    /// one; on an exact tie, starting player alternates by round number.
    private static func nextRoundStarter(_ state: GameState) -> String {
        guard state.lastRoundResults.count == 2 else {
            return state.players[state.roundNumber % 2].id
        }
        let results = state.lastRoundResults
        if results[0].total == results[1].total {
            return state.players[state.roundNumber % 2].id
        }
        return results[0].total < results[1].total ? results[0].playerID : results[1].playerID
    }

    private static func dealMarketAndDrawPile(rng: inout RandomNumberGenerator) -> (market: [Card], drawPile: [Card]) {
        var deck = Deck.freshCards().shuffled(using: &rng)
        let camelIndex = deck.firstIndex { $0.good == .camel }
        precondition(camelIndex != nil, "Deck must contain camels")

        var market: [Card] = []
        var camelsPlaced = 0
        deck.removeAll { card in
            guard card.good == .camel, camelsPlaced < 3 else { return false }
            market.append(card)
            camelsPlaced += 1
            return true
        }
        market.append(contentsOf: deck.prefix(2))
        deck.removeFirst(2)
        return (market, deck)
    }

    /// Deals the next 5 cards off `drawPile` as a starting hand. Any camels
    /// among them go straight to the herd, never into the hand - camels are
    /// never treated as ordinary hand cards at any point in the game, and
    /// the initial deal is the one place that distinction isn't already
    /// enforced by an action's own rules (every in-game action that could
    /// add a camel to a hand is rejected by `apply`).
    private static func dealStartingHand(_ drawPile: inout [Card]) -> (hand: [Card], camelCount: Int) {
        let dealt = Array(drawPile.prefix(5))
        drawPile.removeFirst(dealt.count)
        let hand = dealt.filter { $0.good != .camel }
        return (hand, dealt.count - hand.count)
    }

    /// Flips one of `playerID`'s bonus tokens face-up. Deliberately not gated by
    /// turn order or round/game-over state - either player can flip either
    /// player's tokens at any point once they're won, matching the physical
    /// game's simultaneous reveal at scoring time. Idempotent: flipping an
    /// already-revealed token is a no-op.
    public static func revealBonusToken(_ playerID: String, tokenIndex: Int, in input: GameState) -> GameState {
        var state = input
        guard let playerIndex = state.index(of: playerID) else { return state }
        guard tokenIndex >= 0, tokenIndex < state.players[playerIndex].wonBonusTokens.count else { return state }
        if !state.players[playerIndex].revealedBonusTokenIndices.contains(tokenIndex) {
            state.players[playerIndex].revealedBonusTokenIndices.append(tokenIndex)
        }
        return state
    }

    // MARK: - Actions

    public static func apply(_ action: GameAction, by playerID: String, to input: GameState) throws -> GameState {
        guard !input.isGameOver else { throw GameError.gameAlreadyOver }
        guard !input.isRoundOver else { throw GameError.roundAlreadyOver }
        guard input.currentPlayerID == playerID else { throw GameError.notYourTurn }
        guard let playerIndex = input.index(of: playerID) else { throw GameError.notYourTurn }

        var state = input

        switch action {
        case .takeCamels:
            try applyTakeCamels(&state, playerIndex: playerIndex)
        case .takeCard(let marketCardID):
            try applyTakeCard(&state, playerIndex: playerIndex, marketCardID: marketCardID)
        case .exchange(let taken, let given, let givenCamels):
            try applyExchange(&state, playerIndex: playerIndex, takenMarketCardIDs: taken, givenHandCardIDs: given, givenCamelCount: givenCamels)
        case .sell(let handCardIDs):
            try applySell(&state, playerIndex: playerIndex, handCardIDs: handCardIDs)
        }

        guard state.players[playerIndex].hand.count <= Player.handLimit else {
            throw GameError.handLimitExceeded
        }

        evaluateRoundEnd(&state)

        if !state.isRoundOver {
            state.currentPlayerID = state.players.first { $0.id != playerID }?.id ?? state.currentPlayerID
        }

        return state
    }

    private static func applyTakeCamels(_ state: inout GameState, playerIndex: Int) throws {
        let camelCards = state.market.filter { $0.good == .camel }
        guard !camelCards.isEmpty else { throw GameError.noCamelsInMarket }
        state.market.removeAll { $0.good == .camel }
        state.players[playerIndex].camelCount += camelCards.count
        refillMarket(&state)
    }

    private static func applyTakeCard(_ state: inout GameState, playerIndex: Int, marketCardID: String) throws {
        guard let cardIndex = state.market.firstIndex(where: { $0.id == marketCardID }) else {
            throw GameError.cardNotInMarket
        }
        let card = state.market[cardIndex]
        guard card.good != .camel else { throw GameError.cannotTakeCamelViaSingleTake }
        guard state.players[playerIndex].hand.count < Player.handLimit else {
            throw GameError.handLimitExceeded
        }
        state.market.remove(at: cardIndex)
        state.players[playerIndex].hand.append(card)
        refillMarket(&state, count: 1)
    }

    private static func applyExchange(
        _ state: inout GameState,
        playerIndex: Int,
        takenMarketCardIDs: [String],
        givenHandCardIDs: [String],
        givenCamelCount: Int
    ) throws {
        let takenCount = takenMarketCardIDs.count
        let givenCount = givenHandCardIDs.count + givenCamelCount
        guard (2...5).contains(takenCount) else { throw GameError.exchangeCountOutOfRange }
        guard takenCount == givenCount else { throw GameError.exchangeCountMismatch }
        guard Set(takenMarketCardIDs).count == takenCount else { throw GameError.exchangeCountMismatch }
        guard Set(givenHandCardIDs).count == givenHandCardIDs.count else { throw GameError.exchangeCountMismatch }
        guard state.players[playerIndex].camelCount >= givenCamelCount else {
            throw GameError.exchangeInsufficientCamelsInHerd
        }

        var takenCards: [Card] = []
        for id in takenMarketCardIDs {
            guard let card = state.market.first(where: { $0.id == id }) else { throw GameError.cardNotInMarket }
            guard card.good != .camel else { throw GameError.exchangeCannotIncludeCamelFromMarket }
            takenCards.append(card)
        }

        var givenCards: [Card] = []
        for id in givenHandCardIDs {
            guard let card = state.players[playerIndex].hand.first(where: { $0.id == id }) else {
                throw GameError.cardNotInHand
            }
            givenCards.append(card)
        }

        state.market.removeAll { card in takenMarketCardIDs.contains(card.id) }
        state.players[playerIndex].hand.removeAll { card in givenHandCardIDs.contains(card.id) }
        state.players[playerIndex].hand.append(contentsOf: takenCards)
        state.players[playerIndex].camelCount -= givenCamelCount

        state.market.append(contentsOf: givenCards)
        for _ in 0..<givenCamelCount {
            state.market.append(Card(good: .camel))
        }
    }

    private static func applySell(_ state: inout GameState, playerIndex: Int, handCardIDs: [String]) throws {
        guard !handCardIDs.isEmpty else { throw GameError.emptyAction }
        var cards: [Card] = []
        for id in handCardIDs {
            guard let card = state.players[playerIndex].hand.first(where: { $0.id == id }) else {
                throw GameError.cardNotInHand
            }
            cards.append(card)
        }
        guard let good = cards.first?.good, cards.allSatisfy({ $0.good == good }) else {
            throw GameError.sellRequiresCardsOfSameGood
        }
        guard cards.count >= good.minimumSaleSize else {
            throw GameError.sellBelowMinimumForPreciousGood
        }

        state.players[playerIndex].hand.removeAll { card in handCardIDs.contains(card.id) }
        state.discard.append(contentsOf: cards)

        let tokens = state.tokenBank.takeTokens(for: good, count: cards.count)
        state.players[playerIndex].wonTokens[good, default: []].append(contentsOf: tokens)

        if let bonus = state.bonusTokenBank.drawBonus(forCardsSold: cards.count) {
            state.players[playerIndex].wonBonusTokens.append(bonus)
        }
    }

    private static func refillMarket(_ state: inout GameState, count: Int = 5) {
        let needed = min(count, 5 - state.market.count)
        guard needed > 0 else { return }
        let draw = Array(state.drawPile.prefix(needed))
        state.market.append(contentsOf: draw)
        state.drawPile.removeFirst(draw.count)
    }

    // MARK: - Round / game end

    private static func evaluateRoundEnd(_ state: inout GameState) {
        if state.tokenBank.exhaustedStackCount >= 3 {
            state.roundEndReason = .threeStacksExhausted
        } else if state.drawPile.isEmpty && state.market.count < 5 {
            state.roundEndReason = .deckExhausted
        } else {
            return
        }
        finishRound(&state)
    }

    private static func finishRound(_ state: inout GameState) {
        guard state.players.count == 2 else { return }
        let p0 = state.players[0]
        let p1 = state.players[1]

        var camelBonus0 = 0
        var camelBonus1 = 0
        if p0.camelCount > p1.camelCount {
            camelBonus0 = 5
        } else if p1.camelCount > p0.camelCount {
            camelBonus1 = 5
        }

        let result0 = RoundResult(playerID: p0.id, goodsValue: p0.roundGoodsValue, bonusValue: p0.roundBonusValue, camelBonus: camelBonus0)
        let result1 = RoundResult(playerID: p1.id, goodsValue: p1.roundGoodsValue, bonusValue: p1.roundBonusValue, camelBonus: camelBonus1)
        state.lastRoundResults = [result0, result1]

        if result0.total != result1.total {
            let winnerID = result0.total > result1.total ? p0.id : p1.id
            if let idx = state.index(of: winnerID) {
                state.players[idx].roundsWon += 1
                if state.players[idx].roundsWon >= 2 {
                    state.winnerID = winnerID
                }
            }
        }
    }
}
