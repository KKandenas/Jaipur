import XCTest
@testable import JaipurKit

final class DeckTests: XCTestCase {
    func testDeckComposition() {
        let cards = Deck.freshCards()
        XCTAssertEqual(cards.count, 55)
        XCTAssertEqual(cards.filter { $0.good == .camel }.count, 11)
        XCTAssertEqual(cards.filter { $0.good == .diamond }.count, 6)
        XCTAssertEqual(cards.filter { $0.good == .gold }.count, 6)
        XCTAssertEqual(cards.filter { $0.good == .silver }.count, 6)
        XCTAssertEqual(cards.filter { $0.good == .cloth }.count, 8)
        XCTAssertEqual(cards.filter { $0.good == .spice }.count, 8)
        XCTAssertEqual(cards.filter { $0.good == .leather }.count, 10)
        XCTAssertEqual(Deck.totalCardCount, 55)
    }

    func testAllCardsHaveUniqueIDs() {
        let cards = Deck.freshCards()
        XCTAssertEqual(Set(cards.map(\.id)).count, cards.count)
    }
}
