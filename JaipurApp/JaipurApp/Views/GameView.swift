import SwiftUI
import JaipurKit

struct GameView: View {
    @EnvironmentObject private var session: SessionViewModel
    @StateObject private var viewModel: GameViewModel
    @State private var mode: ActionMode = .none

    init(code: String, myID: String) {
        _viewModel = StateObject(wrappedValue: GameViewModel(code: code, myID: myID))
    }

    var body: some View {
        ZStack {
            background

            if let state = viewModel.state {
                boardContent(state: state)

                if state.isRoundOver {
                    Color.black.opacity(0.45).ignoresSafeArea()
                    RoundEndOverlay(
                        state: state,
                        myID: viewModel.myID,
                        isSubmitting: viewModel.isSubmitting,
                        onNextRound: viewModel.startNextRound,
                        onLeave: { session.leaveGame() }
                    )
                }
            } else {
                ProgressView("Waiting for the game to start…")
                    .foregroundStyle(.white)
                    .tint(.white)
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("Leave") { session.leaveGame() }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Text(viewModel.code).font(.headline.monospaced())
            }
        }
        .onAppear { viewModel.start() }
        .onDisappear { viewModel.stop() }
        .alert("Something went wrong", isPresented: errorBinding) {
            Button("OK") { viewModel.errorMessage = nil }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
    }

    private var errorBinding: Binding<Bool> {
        Binding(get: { viewModel.errorMessage != nil }, set: { if !$0 { viewModel.errorMessage = nil } })
    }

    private var background: some View {
        LinearGradient(
            colors: [Color(red: 0.86, green: 0.58, blue: 0.32), Color(red: 0.74, green: 0.42, blue: 0.2)],
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
    }

    @ViewBuilder
    private func boardContent(state: GameState) -> some View {
        VStack(spacing: 14) {
            if let opponent = viewModel.opponent {
                PlayerBarView(player: opponent, isCurrentTurn: state.currentPlayerID == opponent.id, showHandAsCount: true)
            }

            HStack(alignment: .top, spacing: 12) {
                TokenTrayView(tokenBank: state.tokenBank)
                    .frame(width: 130)

                VStack(spacing: 10) {
                    Spacer(minLength: 0)
                    MarketView(
                        cards: state.market,
                        isInteractive: viewModel.isMyTurn && mode != .selling,
                        isExchanging: mode == .exchanging,
                        selectedIDs: viewModel.selectedMarketCardIDs,
                        onTapCard: handleMarketTap
                    )
                    Spacer(minLength: 0)
                    BonusTokenSummaryView(bank: state.bonusTokenBank)
                }
                .frame(maxWidth: .infinity)
            }
            .frame(maxHeight: .infinity)

            if mode == .exchanging, let me = viewModel.me, me.camelCount > 0 {
                Stepper(
                    "Give \(viewModel.selectedCamelsToGive) camel\(viewModel.selectedCamelsToGive == 1 ? "" : "s") from herd",
                    value: $viewModel.selectedCamelsToGive,
                    in: 0...me.camelCount
                )
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(RoundedRectangle(cornerRadius: 10).fill(Color.black.opacity(0.25)))
                .foregroundStyle(.white)
            }

            if let me = viewModel.me {
                HandView(
                    cards: me.hand,
                    selectedIDs: mode == .selling ? viewModel.selectedSellCardIDs : viewModel.selectedHandCardIDs,
                    isInteractive: viewModel.isMyTurn && mode != .none,
                    disabledPredicate: handDisabled,
                    onTapCard: handleHandTap
                )

                PlayerBarView(player: me, isCurrentTurn: state.currentPlayerID == me.id, showHandAsCount: false)
            }

            ActionBar(
                mode: mode,
                isMyTurn: viewModel.isMyTurn,
                canTakeCamels: state.market.contains { $0.good == .camel },
                canConfirmExchange: viewModel.canConfirmExchange,
                canConfirmSell: viewModel.canConfirmSell,
                isSubmitting: viewModel.isSubmitting,
                onTakeCamels: viewModel.takeCamels,
                onStartExchange: { mode = .exchanging },
                onStartSell: { mode = .selling },
                onConfirm: {
                    switch mode {
                    case .exchanging: viewModel.confirmExchange()
                    case .selling: viewModel.confirmSell()
                    case .none: break
                    }
                    mode = .none
                },
                onCancel: {
                    viewModel.clearSelections()
                    mode = .none
                }
            )
        }
        .padding(12)
    }

    private func handleMarketTap(_ card: Card) {
        if mode == .exchanging {
            viewModel.toggleMarketSelection(card)
        } else if mode == .none {
            viewModel.takeCard(card)
        }
    }

    private func handleHandTap(_ card: Card) {
        switch mode {
        case .exchanging: viewModel.toggleHandSelectionForExchange(card)
        case .selling: viewModel.toggleHandSelectionForSale(card)
        case .none: break
        }
    }

    private func handDisabled(_ card: Card) -> Bool {
        guard mode == .selling, let good = viewModel.selectedSellGood else { return false }
        return card.good != good
    }
}
