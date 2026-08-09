import Foundation

public struct Player: Codable, Equatable, Identifiable, Sendable {
    public let id: String
    public var displayName: String

    /// Goods cards only (never camels). Limited to 7 at the end of any turn.
    public var hand: [Card]

    /// Camels are fungible and tracked purely as a count in the player's herd.
    public var camelCount: Int

    /// Goods tokens won this round, keyed by good type, each entry one token's value.
    public var wonTokens: [GoodType: [Int]]

    /// Bonus tokens won this round (values only; the two "kinds" of bonus stack are not distinguished on score).
    public var wonBonusTokens: [Int]

    /// Indices into `wonBonusTokens` that either player has flipped face-up during this
    /// round's scoring reveal. Synced like the rest of `GameState` so a flip either
    /// player makes shows up on both screens.
    public var revealedBonusTokenIndices: [Int]

    /// Round wins across the whole match (first to 2 wins the game).
    public var roundsWon: Int

    public init(
        id: String,
        displayName: String,
        hand: [Card] = [],
        camelCount: Int = 0,
        wonTokens: [GoodType: [Int]] = [:],
        wonBonusTokens: [Int] = [],
        revealedBonusTokenIndices: [Int] = [],
        roundsWon: Int = 0
    ) {
        self.id = id
        self.displayName = displayName
        self.hand = hand
        self.camelCount = camelCount
        self.wonTokens = wonTokens
        self.wonBonusTokens = wonBonusTokens
        self.revealedBonusTokenIndices = revealedBonusTokenIndices
        self.roundsWon = roundsWon
    }

    public static let handLimit = 7

    public var goodsCardCount: Int { hand.count }

    /// Sum of all token values won this round, excluding any camel bonus (added separately at scoring time).
    public var roundGoodsValue: Int {
        wonTokens.values.reduce(0) { $0 + $1.reduce(0, +) }
    }

    public var roundBonusValue: Int {
        wonBonusTokens.reduce(0, +)
    }

    public func count(of good: GoodType) -> Int {
        hand.filter { $0.good == good }.count
    }
}
