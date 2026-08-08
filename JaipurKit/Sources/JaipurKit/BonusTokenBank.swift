import Foundation

/// The three bonus-token stacks awarded when a player sells 3, 4, or 5+ cards at once.
/// Values confirmed from published Jaipur rules summaries: 18 tokens total
/// (7 for selling-3, 6 for selling-4, 5 for selling-5-or-more).
public struct BonusTokenBank: Codable, Equatable, Sendable {
    public private(set) var saleOfThree: [Int]
    public private(set) var saleOfFour: [Int]
    public private(set) var saleOfFiveOrMore: [Int]

    public init(
        saleOfThree: [Int] = [3, 3, 2, 2, 2, 1, 1],
        saleOfFour: [Int] = [6, 6, 5, 5, 4, 4],
        saleOfFiveOrMore: [Int] = [10, 10, 9, 8, 8]
    ) {
        self.saleOfThree = saleOfThree
        self.saleOfFour = saleOfFour
        self.saleOfFiveOrMore = saleOfFiveOrMore
    }

    /// Draws the next bonus token for selling `cardCount` cards at once, if any remain.
    /// Returns nil for sales of fewer than 3 cards (no bonus applies) or an exhausted stack.
    public mutating func drawBonus(forCardsSold cardCount: Int) -> Int? {
        switch cardCount {
        case ..<3:
            return nil
        case 3:
            guard !saleOfThree.isEmpty else { return nil }
            return saleOfThree.removeFirst()
        case 4:
            guard !saleOfFour.isEmpty else { return nil }
            return saleOfFour.removeFirst()
        default:
            guard !saleOfFiveOrMore.isEmpty else { return nil }
            return saleOfFiveOrMore.removeFirst()
        }
    }
}
