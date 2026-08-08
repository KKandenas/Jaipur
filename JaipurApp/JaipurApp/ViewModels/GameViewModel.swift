import Foundation
import JaipurKit

/// Drives a single game screen: listens to Firestore for the live `GameState`,
/// tracks the in-progress "exchange" / "sell" selections the player is building
/// with taps, and turns a confirmed selection into a `GameAction` sent through
/// `GameService`. All rules validation still happens in `GameEngine` server-side
/// (inside the Firestore transaction) - the `can...` checks here only exist to
/// keep the UI's buttons honest, not as a security boundary.
@MainActor
final class GameViewModel: ObservableObject {
    @Published private(set) var document: GameDocument?
    @Published var errorMessage: String?
    @Published var isSubmitting = false

    @Published var selectedMarketCardIDs: Set<String> = []
    @Published var selectedHandCardIDs: Set<String> = []
    @Published var selectedCamelsToGive: Int = 0
    @Published var selectedSellCardIDs: Set<String> = []

    let code: String
    let myID: String

    private let service = GameService.shared
    private var observeTask: Task<Void, Never>?

    init(code: String, myID: String) {
        self.code = code
        self.myID = myID
    }

    func start() {
        observeTask?.cancel()
        observeTask = Task { [weak self] in
            guard let self else { return }
            for await doc in self.service.observeGame(code: self.code) {
                self.document = doc
                if doc.state?.currentPlayerID != self.myID {
                    self.clearSelections()
                }
            }
        }
    }

    func stop() {
        observeTask?.cancel()
        observeTask = nil
    }

    // MARK: - Derived state

    var state: GameState? { document?.state }
    var me: Player? { state?.player(myID) }
    var opponent: Player? { state?.opponent(of: myID) }
    var isMyTurn: Bool { state?.currentPlayerID == myID }

    var selectedSellGood: GoodType? {
        guard let me else { return nil }
        let cards = me.hand.filter { selectedSellCardIDs.contains($0.id) }
        return cards.first?.good
    }

    var canConfirmExchange: Bool {
        let takenCount = selectedMarketCardIDs.count
        let givenCount = selectedHandCardIDs.count + selectedCamelsToGive
        return (2...5).contains(takenCount) && takenCount == givenCount
    }

    var canConfirmSell: Bool {
        guard let me, let good = selectedSellGood else { return false }
        let cards = me.hand.filter { selectedSellCardIDs.contains($0.id) }
        return cards.allSatisfy { $0.good == good } && cards.count >= good.minimumSaleSize
    }

    func clearSelections() {
        selectedMarketCardIDs = []
        selectedHandCardIDs = []
        selectedCamelsToGive = 0
        selectedSellCardIDs = []
    }

    // MARK: - Selection toggles

    func toggleMarketSelection(_ card: Card) {
        guard card.good != .camel else { return }
        if selectedMarketCardIDs.contains(card.id) {
            selectedMarketCardIDs.remove(card.id)
        } else if selectedMarketCardIDs.count < 5 {
            selectedMarketCardIDs.insert(card.id)
        }
    }

    func toggleHandSelectionForExchange(_ card: Card) {
        if selectedHandCardIDs.contains(card.id) {
            selectedHandCardIDs.remove(card.id)
        } else {
            selectedHandCardIDs.insert(card.id)
        }
    }

    func toggleHandSelectionForSale(_ card: Card) {
        if selectedSellCardIDs.contains(card.id) {
            selectedSellCardIDs.remove(card.id)
        } else {
            selectedSellCardIDs.insert(card.id)
        }
    }

    // MARK: - Actions

    func takeCamels() { perform(.takeCamels) }

    func takeCard(_ card: Card) { perform(.takeCard(marketCardID: card.id)) }

    func confirmExchange() {
        guard canConfirmExchange else { return }
        perform(.exchange(
            takenMarketCardIDs: Array(selectedMarketCardIDs),
            givenHandCardIDs: Array(selectedHandCardIDs),
            givenCamelCount: selectedCamelsToGive
        ))
    }

    func confirmSell() {
        guard canConfirmSell else { return }
        perform(.sell(handCardIDs: Array(selectedSellCardIDs)))
    }

    func startNextRound() {
        isSubmitting = true
        Task {
            defer { isSubmitting = false }
            do {
                try await service.startNextRound(code: code)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func perform(_ action: GameAction) {
        guard isMyTurn, !isSubmitting else { return }
        isSubmitting = true
        Task {
            defer { isSubmitting = false }
            do {
                try await service.applyAction(action, code: code, playerID: myID)
                clearSelections()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
