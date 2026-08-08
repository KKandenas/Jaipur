import Foundation

/// Deterministic RNG so tests (and, later, a server-authoritative deal) can reproduce a shuffle.
public struct SeededGenerator: RandomNumberGenerator {
    private var state: UInt64

    public init(seed: UInt64) {
        self.state = seed &+ 0x9E3779B97F4A7C15
    }

    public mutating func next() -> UInt64 {
        state ^= state >> 12
        state ^= state << 25
        state ^= state >> 27
        return state &* 0x2545F4914F6CDD1D
    }
}
