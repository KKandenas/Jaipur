import Foundation

/// The seven card types in Jaipur. Camel is the only type that is never sold for a token.
public enum GoodType: String, Codable, CaseIterable, Sendable, Identifiable {
    case camel
    case diamond
    case gold
    case silver
    case cloth
    case spice
    case leather

    public var id: String { rawValue }

    /// The three "precious" goods, which require selling at least 2 cards at once.
    public var isPrecious: Bool {
        switch self {
        case .diamond, .gold, .silver: return true
        default: return false
        }
    }

    /// Goods that can be sold for tokens (everything except camels).
    public static var sellableGoods: [GoodType] {
        allCases.filter { $0 != .camel }
    }

    /// Number of cards of this type in the 55-card deck.
    public var deckCount: Int {
        switch self {
        case .camel: return 11
        case .diamond: return 6
        case .gold: return 6
        case .silver: return 6
        case .cloth: return 8
        case .spice: return 8
        case .leather: return 10
        }
    }

    /// Minimum number of cards that must be sold at once for this good.
    public var minimumSaleSize: Int {
        isPrecious ? 2 : 1
    }
}

/// Lets `Dictionary<GoodType, _>` (e.g. `Player.wonTokens`) encode as a proper
/// keyed object (`{"diamond": [...], "gold": [...]}`) instead of a flat
/// alternating-elements array - this is what makes those dictionaries store
/// cleanly as Firestore maps.
extension GoodType: CodingKeyRepresentable {
    private struct GoodTypeCodingKey: CodingKey {
        var stringValue: String
        init(stringValue: String) { self.stringValue = stringValue }
        var intValue: Int? { nil }
        init?(intValue: Int) { nil }
    }

    public var codingKey: CodingKey {
        GoodTypeCodingKey(stringValue: rawValue)
    }

    public init?<T>(codingKey: T) where T: CodingKey {
        self.init(rawValue: codingKey.stringValue)
    }
}
