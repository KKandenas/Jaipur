import SwiftUI
import JaipurKit

/// The bank's remaining goods tokens, one chip per good showing the next
/// (highest) value still available and how many are left in that stack.
struct TokenTrayView: View {
    let tokenBank: TokenBank

    private let columns = [GridItem(.adaptive(minimum: 52), spacing: 8)]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 8) {
            ForEach(GoodType.sellableGoods) { good in
                TokenChip(good: good, values: tokenBank.stacks[good] ?? [])
            }
        }
    }
}

private struct TokenChip: View {
    let good: GoodType
    let values: [Int]

    var body: some View {
        ZStack {
            Circle()
                .fill(values.isEmpty ? Color.gray.opacity(0.3) : good.tint)
            Circle()
                .strokeBorder(Color.white.opacity(0.8), lineWidth: 2)
            VStack(spacing: 0) {
                Image(systemName: good.symbolName)
                    .font(.system(size: 12, weight: .bold))
                Text(values.first.map(String.init) ?? "—")
                    .font(.system(size: 13, weight: .heavy))
            }
            .foregroundStyle(.white)
        }
        .frame(width: 52, height: 52)
        .overlay(alignment: .bottomTrailing) {
            Text("\(values.count)")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.white)
                .padding(4)
                .background(Circle().fill(Color.black.opacity(0.55)))
                .offset(x: 4, y: 4)
        }
        .accessibilityLabel("\(good.displayName), \(values.count) tokens left, next worth \(values.first ?? 0)")
    }
}

struct BonusTokenSummaryView: View {
    let bank: BonusTokenBank

    var body: some View {
        HStack(spacing: 10) {
            bonusStack(title: "×3", values: bank.saleOfThree)
            bonusStack(title: "×4", values: bank.saleOfFour)
            bonusStack(title: "×5+", values: bank.saleOfFiveOrMore)
        }
    }

    private func bonusStack(title: String, values: [Int]) -> some View {
        VStack(spacing: 2) {
            Text(title).font(.caption2.bold())
            Text(values.first.map(String.init) ?? "—")
                .font(.system(size: 14, weight: .heavy))
                .frame(width: 34, height: 34)
                .background(Circle().fill(Color.black.opacity(0.35)))
        }
        .foregroundStyle(.white)
    }
}

#Preview {
    VStack(spacing: 16) {
        TokenTrayView(tokenBank: TokenBank())
        BonusTokenSummaryView(bank: BonusTokenBank())
    }
    .padding()
    .background(Color(red: 0.85, green: 0.6, blue: 0.35))
}
