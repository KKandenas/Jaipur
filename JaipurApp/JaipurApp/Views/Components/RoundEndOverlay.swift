import SwiftUI
import JaipurKit

struct RoundEndOverlay: View {
    let state: GameState
    let myID: String
    let isSubmitting: Bool
    let onNextRound: () -> Void
    let onLeave: () -> Void

    var body: some View {
        VStack(spacing: 18) {
            Text(state.isGameOver ? "Game Over" : "Round \(state.roundNumber) Complete")
                .font(.title.bold())

            VStack(spacing: 10) {
                ForEach(state.lastRoundResults, id: \.playerID) { result in
                    resultRow(result)
                }
            }
            .padding()
            .background(RoundedRectangle(cornerRadius: 14).fill(Color.black.opacity(0.06)))

            if let winnerID = state.winnerID {
                Text(winnerID == myID ? "🎉 You won the match!" : "\(state.player(winnerID)?.displayName ?? "Opponent") won the match.")
                    .font(.headline)
            }

            if state.isGameOver {
                Button("Back to Lobby", action: onLeave)
                    .buttonStyle(.borderedProminent)
            } else {
                Button(action: onNextRound) {
                    Label("Start Round \(state.roundNumber + 1)", systemImage: "arrow.clockwise")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                }
                .buttonStyle(.borderedProminent)
                .disabled(isSubmitting)
            }
        }
        .padding(24)
        .frame(maxWidth: 360)
        .background(RoundedRectangle(cornerRadius: 20).fill(Color(.systemBackground)))
        .shadow(radius: 20)
    }

    private func resultRow(_ result: RoundResult) -> some View {
        let name = state.player(result.playerID)?.displayName ?? "Player"
        return HStack {
            Text(result.playerID == myID ? "You (\(name))" : name)
                .fontWeight(.semibold)
            Spacer()
            Text("\(result.goodsValue) + \(result.bonusValue) bonus + \(result.camelBonus) camel = \(result.total) ₹")
                .font(.subheadline.monospacedDigit())
        }
    }
}
