import Foundation

/// Every legal turn a player can take. Exactly one of these is played per turn.
public enum GameAction: Codable, Equatable, Sendable {
    /// Take every camel currently in the market into your herd.
    case takeCamels
    /// Take a single non-camel card from the market into your hand.
    case takeCard(marketCardID: String)
    /// Give `given` (from hand + herd) for `taken` (from market). Counts must match and be 2...5.
    case exchange(takenMarketCardIDs: [String], givenHandCardIDs: [String], givenCamelCount: Int)
    /// Sell every card of `good` listed in `handCardIDs` (must all share the same good type).
    case sell(handCardIDs: [String])
}

public enum GameError: Error, Equatable, Sendable {
    case notYourTurn
    case gameAlreadyOver
    case roundAlreadyOver
    case cardNotInMarket
    case cardNotInHand
    case cannotTakeCamelViaSingleTake
    case noCamelsInMarket
    case handLimitExceeded
    case exchangeCountOutOfRange
    case exchangeCountMismatch
    case exchangeCannotIncludeCamelFromMarket
    case exchangeInsufficientCamelsInHerd
    case sellRequiresCardsOfSameGood
    case sellBelowMinimumForPreciousGood
    case emptyAction
}
