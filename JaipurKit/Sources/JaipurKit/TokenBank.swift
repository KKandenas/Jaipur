import Foundation

/// Tracks the remaining goods tokens for every sellable good, and dispenses them
/// highest-value-first, exactly like the physical stacks on the game board.
///
/// Confirmed against the physical game's component list: 38 goods tokens
/// total (5 diamond + 5 gold + 5 silver + 7 cloth + 7 spice + 9 leather).
public struct TokenBank: Codable, Equatable, Sendable {
    /// Values remaining in each stack, ordered highest-value-first (index 0 = next token given out).
    public private(set) var stacks: [GoodType: [Int]]

    public init(stacks: [GoodType: [Int]]? = nil) {
        self.stacks = stacks ?? Self.defaultStacks
    }

    public static let defaultStacks: [GoodType: [Int]] = [
        .diamond: [7, 7, 5, 5, 5],
        .gold: [6, 6, 5, 5, 5],
        .silver: [5, 5, 5, 5, 5],
        .cloth: [5, 3, 3, 2, 2, 1, 1],
        .spice: [5, 3, 3, 2, 2, 1, 1],
        .leather: [4, 3, 2, 1, 1, 1, 1, 1, 1]
    ]

    public func remainingCount(for good: GoodType) -> Int {
        stacks[good]?.count ?? 0
    }

    public var isEmpty: Bool {
        stacks[.diamond]?.isEmpty ?? true
    }

    /// Number of good types whose stack is fully depleted. The round ends once this reaches 3.
    public var exhaustedStackCount: Int {
        GoodType.sellableGoods.filter { remainingCount(for: $0) == 0 }.count
    }

    /// Removes and returns up to `count` tokens from the top of `good`'s stack.
    /// Returns fewer than `count` values if the stack runs out early.
    @discardableResult
    public mutating func takeTokens(for good: GoodType, count: Int) -> [Int] {
        guard var stack = stacks[good], count > 0 else { return [] }
        let taken = Array(stack.prefix(count))
        stack.removeFirst(taken.count)
        stacks[good] = stack
        return taken
    }
}
