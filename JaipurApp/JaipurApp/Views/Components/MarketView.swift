import SwiftUI
import JaipurKit

struct MarketView: View {
    let cards: [Card]
    let isInteractive: Bool
    let isExchanging: Bool
    let selectedIDs: Set<String>
    let onTapCard: (Card) -> Void

    var body: some View {
        HStack(spacing: 10) {
            ForEach(cards) { card in
                CardView(card: card, isSelected: selectedIDs.contains(card.id))
                    .onTapGesture {
                        guard isInteractive else { return }
                        guard isExchanging || card.good != .camel else { return }
                        onTapCard(card)
                    }
                    .allowsHitTesting(isInteractive)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.black.opacity(0.12))
        )
    }
}
