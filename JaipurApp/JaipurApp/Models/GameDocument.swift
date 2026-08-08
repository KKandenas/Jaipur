import Foundation
import FirebaseFirestore
import JaipurKit

enum GameStatus: String, Codable {
    case waiting
    case active
    case finished
}

/// The Firestore document at `games/{code}`.
///
/// Tier-1 (implemented here): the full `GameState` - including the draw pile order
/// and the opponent's hand - lives in one document both players can read. That's
/// enough to play honestly with a friend, but a motivated player could read the
/// Firestore doc directly and see cards they shouldn't. See the README's
/// "Hardening hidden information" section for the Cloud Functions-based Tier-2
/// design that closes that gap without changing this model's shape much.
struct GameDocument: Codable, Equatable {
    @DocumentID var id: String?
    var status: GameStatus
    var hostID: String
    var hostName: String
    var playerIDs: [String]
    var createdAt: Date
    var updatedAt: Date
    var state: GameState?

    static func == (lhs: GameDocument, rhs: GameDocument) -> Bool {
        lhs.id == rhs.id &&
        lhs.status == rhs.status &&
        lhs.hostID == rhs.hostID &&
        lhs.playerIDs == rhs.playerIDs &&
        lhs.state == rhs.state
    }
}
