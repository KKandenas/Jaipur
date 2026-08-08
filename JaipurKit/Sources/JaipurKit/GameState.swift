import Foundation

public enum RoundEndReason: String, Codable, Sendable {
    case threeStacksExhausted
    case deckExhausted
}

public struct RoundResult: Codable, Equatable, Sendable {
    public let playerID: String
    public let goodsValue: Int
    public let bonusValue: Int
    public let camelBonus: Int
    public var total: Int { goodsValue + bonusValue + camelBonus }
}

public struct GameState: Codable, Equatable, Sendable {
    public var players: [Player]
    public var market: [Card]
    public var drawPile: [Card]
    public var discard: [Card]
    public var tokenBank: TokenBank
    public var bonusTokenBank: BonusTokenBank
    public var currentPlayerID: String
    public var roundNumber: Int
    public var roundEndReason: RoundEndReason?
    public var lastRoundResults: [RoundResult]
    public var winnerID: String?

    public init(
        players: [Player],
        market: [Card],
        drawPile: [Card],
        discard: [Card] = [],
        tokenBank: TokenBank = TokenBank(),
        bonusTokenBank: BonusTokenBank = BonusTokenBank(),
        currentPlayerID: String,
        roundNumber: Int = 1,
        roundEndReason: RoundEndReason? = nil,
        lastRoundResults: [RoundResult] = [],
        winnerID: String? = nil
    ) {
        self.players = players
        self.market = market
        self.drawPile = drawPile
        self.discard = discard
        self.tokenBank = tokenBank
        self.bonusTokenBank = bonusTokenBank
        self.currentPlayerID = currentPlayerID
        self.roundNumber = roundNumber
        self.roundEndReason = roundEndReason
        self.lastRoundResults = lastRoundResults
        self.winnerID = winnerID
    }

    public var isRoundOver: Bool { roundEndReason != nil }
    public var isGameOver: Bool { winnerID != nil }

    public func player(_ id: String) -> Player? {
        players.first { $0.id == id }
    }

    public func index(of playerID: String) -> Int? {
        players.firstIndex { $0.id == playerID }
    }

    public func opponent(of playerID: String) -> Player? {
        players.first { $0.id != playerID }
    }
}
