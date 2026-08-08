import SwiftUI
import JaipurKit

struct HandView: View {
    let cards: [Card]
    let selectedIDs: Set<String>
    let isInteractive: Bool
    let disabledPredicate: (Card) -> Bool
    let onTapCard: (Card) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(cards) { card in
                    CardView(
                        card: card,
                        isSelected: selectedIDs.contains(card.id),
                        isDisabled: disabledPredicate(card)
                    )
                    .onTapGesture {
                        guard isInteractive, !disabledPredicate(card) else { return }
                        onTapCard(card)
                    }
                }
            }
            .padding(.horizontal, 4)
        }
    }
}
