import Foundation

@MainActor
final class LobbyViewModel: ObservableObject {
    @Published var joinCodeInput: String = ""
    @Published var isWorking = false
    @Published var errorMessage: String?

    private let service = GameService.shared

    func createGame(userID: String, displayName: String) async -> String? {
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }
        do {
            return try await service.createGame(hostID: userID, hostName: displayName)
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    func joinGame(userID: String, displayName: String) async -> String? {
        let code = joinCodeInput.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        guard !code.isEmpty else {
            errorMessage = "Enter a game code first."
            return nil
        }
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }
        do {
            try await service.joinGame(code: code, guestID: userID, guestName: displayName)
            return code
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }
}
