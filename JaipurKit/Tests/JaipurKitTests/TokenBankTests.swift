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
        _ = bank.takeTokens(for: .gold, count: 5)
        XCTAssertEqual(bank.exhaustedStackCount, 2)
        _ = bank.takeTokens(for: .silver, count: 5)
        XCTAssertEqual(bank.exhaustedStackCount, 3)
    }

    func testBonusTokenStacksDrawHighestFirstAndExhaust() {
        var bonus = BonusTokenBank()
        XCTAssertEqual(bonus.drawBonus(forCardsSold: 3), 3)
        XCTAssertEqual(bonus.drawBonus(forCardsSold: 4), 6)
        // saleOfFiveOrMore starts [10, 10, 9, 9, 8, 8] - selling 5 and selling 7
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

    func testShuffledBonusTokenBankKeepsTheSameValuesButNotAlwaysTheSameOrder() {
        var rng: RandomNumberGenerator = SeededGenerator(seed: 1)
        let bank = BonusTokenBank.shuffled(using: &rng)
        XCTAssertEqual(bank.saleOfThree.sorted(), [1, 1, 2, 2, 3, 3])
        XCTAssertEqual(bank.saleOfFour.sorted(), [4, 4, 5, 5, 6, 6])
        XCTAssertEqual(bank.saleOfFiveOrMore.sorted(), [8, 8, 9, 9, 10, 10])

        // Vanishingly unlikely for every one of many seeds to reproduce the
        // exact unshuffled order - if this ever fails, the shuffle broke.
        let allUnshuffled = (0..<20).allSatisfy { seed -> Bool in
            var seededRng: RandomNumberGenerator = SeededGenerator(seed: UInt64(seed))
            let b = BonusTokenBank.shuffled(using: &seededRng)
            return b.saleOfThree == [3, 3, 2, 2, 1, 1]
                && b.saleOfFour == [6, 6, 5, 5, 4, 4]
                && b.saleOfFiveOrMore == [10, 10, 9, 9, 8, 8]
        }
        XCTAssertFalse(allUnshuffled)
    }

    func testShuffledBonusTokenBankIsReproducibleForASeed() {
        var rngA: RandomNumberGenerator = SeededGenerator(seed: 7)
        var rngB: RandomNumberGenerator = SeededGenerator(seed: 7)
        XCTAssertEqual(BonusTokenBank.shuffled(using: &rngA), BonusTokenBank.shuffled(using: &rngB))
    }
}
