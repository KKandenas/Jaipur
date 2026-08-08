import Foundation

public enum Deck {
    /// Builds the full 55-card Jaipur deck (unshuffled).
    /// Composition: 6 diamond, 6 gold, 6 silver, 8 cloth, 8 spice, 10 leather, 11 camel.
    public static func freshCards() -> [Card] {
        var cards: [Card] = []
        for good in GoodType.allCases {
            for i in 0..<good.deckCount {
                cards.append(Card(id: "\(good.rawValue)-\(i)-\(UUID().uuidString.prefix(6))", good: good))
            }
        }
        return cards
    }

    public static let totalCardCount: Int = GoodType.allCases.reduce(0) { $0 + $1.deckCount }
}
