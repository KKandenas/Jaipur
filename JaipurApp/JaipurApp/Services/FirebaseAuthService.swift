import Foundation
import FirebaseAuth

/// Thin wrapper around Firebase Anonymous Auth. Every device gets a stable anonymous
/// UID (persisted by the Firebase SDK across launches) which is all Jaipur needs to
/// tell the two players in a match apart - there's no account system to build or manage.
@MainActor
final class FirebaseAuthService {
    static let shared = FirebaseAuthService()
    private init() {}

    var currentUserID: String? { Auth.auth().currentUser?.uid }

    @discardableResult
    func ensureSignedIn() async throws -> String {
        if let uid = Auth.auth().currentUser?.uid {
            return uid
        }
        let result = try await Auth.auth().signInAnonymously()
        return result.user.uid
    }
}
