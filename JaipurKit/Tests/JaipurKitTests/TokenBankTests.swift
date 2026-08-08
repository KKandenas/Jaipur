import XCTest
@testable import JaipurKit

final class TokenBankTests: XCTestCase {
    func testTokensDispensedHighestFirst() {
        var bank = TokenBank()
        let taken = bank.takeTokens(for: .diamond, count: 2)
        XCTAssertEqual(taken, [7, 7])
        XCTAssertEqual(bank.remainingCount(for: .diamond), 3)
    }

    func testTakingMoreThanRemainingReturnsWhatsLeft() {
        var bank = TokenBank()
        _ = bank.takeTokens(for: .diamond, count: 5)
        let taken = bank.takeTokens(for: .diamond, count: 3)
        XCTAssertEqual(taken, [])
        XCTAssertEqual(bank.remainingCount(for: .diamond), 0)
    }

    func testExhaustedStackCount() {
        var bank = TokenBank()
        XCTAssertEqual(bank.exhaustedStackCount, 0)
        _ = bank.takeTokens(for: .diamond, count: 5)
        _ = bank.takeTokens(for: .gold, count: 6)
        XCTAssertEqual(bank.exhaustedStackCount, 2)
        _ = bank.takeTokens(for: .silver, count: 6)
        XCTAssertEqual(bank.exhaustedStackCount, 3)
    }

    func testBonusTokenStacksDrawHighestFirstAndExhaust() {
        var bonus = BonusTokenBank()
        XCTAssertEqual(bonus.drawBonus(forCardsSold: 3), 3)
        XCTAssertEqual(bonus.drawBonus(forCardsSold: 4), 6)
        // saleOfFiveOrMore starts [10, 10, 9, 8, 8] - selling 5 and selling 7
        // both draw from this same stack, so the second draw gets the second 10.
        XCTAssertEqual(bonus.drawBonus(forCardsSold: 5), 10)
        XCTAssertEqual(bonus.drawBonus(forCardsSold: 7), 10) // 5-or-more stack shared by 6+
        XCTAssertEqual(bonus.drawBonus(forCardsSold: 6), 9)
        XCTAssertNil(bonus.drawBonus(forCardsSold: 2))
    }

    func testBonusTokenStackCanExhaust() {
        var bonus = BonusTokenBank(saleOfThree: [3], saleOfFour: [], saleOfFiveOrMore: [])
        XCTAssertEqual(bonus.drawBonus(forCardsSold: 3), 3)
        XCTAssertNil(bonus.drawBonus(forCardsSold: 3))
        XCTAssertNil(bonus.drawBonus(forCardsSold: 4))
    }
}
