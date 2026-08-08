import Foundation

/// App-wide state: who this device is (anonymous Firebase UID + a chosen display
/// name) and which game, if any, is currently open. `RootView` switches between
/// the lobby and the board purely based on `activeGameCode`.
@MainActor
final class SessionViewModel: ObservableObject {
    @Published private(set) var userID: String?
    @Published var displayName: String
    @Published var activeGameCode: String?
    @Published var startupError: String?

    private let auth = FirebaseAuthService.shared
    private static let displayNameKey = "jaipur.displayName"

    init() {
        displayName = UserDefaults.standard.string(forKey: Self.displayNameKey) ?? Self.randomGuestName()
    }

    func start() async {
        do {
            userID = try await auth.ensureSignedIn()
        } catch {
            startupError = error.localizedDescription
        }
    }

    func updateDisplayName(_ name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        displayName = trimmed
        UserDefaults.standard.set(trimmed, forKey: Self.displayNameKey)
    }

    func leaveGame() {
        activeGameCode = nil
    }

    private static func randomGuestName() -> String {
        "Trader\(Int.random(in: 100...999))"
    }
}
