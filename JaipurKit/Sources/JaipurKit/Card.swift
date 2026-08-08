import Foundation

/// A single physical card. Each card has a stable identity so it can be tracked
/// through deck -> market -> hand -> herd -> discard without ambiguity.
public struct Card: Codable, Hashable, Identifiable, Sendable {
    public let id: String
    public let good: GoodType

    public init(id: String = UUID().uuidString, good: GoodType) {
        self.id = id
        self.good = good
    }
}
