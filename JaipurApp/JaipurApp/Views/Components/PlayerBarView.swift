import SwiftUI
import JaipurKit

/// Compact summary row for a player: name, herd size, cards in hand, tokens won
/// this round, and a turn indicator. Used for both "me" and the opponent.
struct PlayerBarView: View {
    let player: Player
    let isCurrentTurn: Bool
    let showHandAsCount: Bool

    var body: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    if isCurrentTurn {
                        Circle().fill(Color.green).frame(width: 8, height: 8)
                    }
                    Text(player.displayName)
                        .font(.headline)
                        .foregroundStyle(.white)
                }
                Text("\(player.roundsWon) round win\(player.roundsWon == 1 ? "" : "s")")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.75))
            }

            Spacer()

            Label("\(player.camelCount)", systemImage: "figure.walk")
                .font(.subheadline.bold())
                .foregroundStyle(.white)

            if showHandAsCount {
                Label("\(player.goodsCardCount)", systemImage: "rectangle.stack.fill")
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
            }

            Text("\(player.roundGoodsValue + player.roundBonusValue) ₹")
                .font(.subheadline.bold())
                .foregroundStyle(.yellow)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.black.opacity(0.25))
        )
    }
}
