import Foundation
import FirebaseFirestore
import JaipurKit

enum GameServiceError: LocalizedError {
    case gameNotFound
    case gameFull
    case invalidState
    case codeGenerationFailed

    var errorDescription: String? {
        switch self {
        case .gameNotFound: return "No game found with that code."
        case .gameFull: return "That game already has two players."
        case .invalidState: return "The game is not in a valid state for that action."
        case .codeGenerationFailed: return "Could not create a new game right now. Try again."
        }
    }
}

/// Owns every read/write against `games/{code}` in Firestore. All state mutation
/// goes through `JaipurKit.GameEngine`, applied inside a Firestore transaction so
/// two near-simultaneous moves can never both "win" and corrupt the board.
@MainActor
final class GameService {
    static let shared = GameService()
    private let db = Firestore.firestore()
    private init() {}

    private var games: CollectionReference { db.collection("games") }

    // MARK: - Create / join

    func createGame(hostID: String, hostName: String) async throws -> String {
        for _ in 0..<5 {
            let code = Self.randomCode()
            let ref = games.document(code)
            let existing = try await ref.getDocument()
            guard !existing.exists else { continue }

            let doc = GameDocument(
                status: .waiting,
                hostID: hostID,
                hostName: hostName,
                playerIDs: [hostID],
                createdAt: Date(),
                updatedAt: Date(),
                state: nil
            )
            try await write(doc, to: ref)
            return code
        }
        throw GameServiceError.codeGenerationFailed
    }

    func joinGame(code: String, guestID: String, guestName: String) async throws {
        let ref = games.document(code.uppercased())
        try await runTransaction { transaction in
            let snapshot = try transaction.getDocument(ref)
            guard var doc = try? snapshot.data(as: GameDocument.self) else {
                throw GameServiceError.gameNotFound
            }
            if doc.playerIDs.contains(guestID) {
                return nil // already joined - e.g. app relaunch mid-game
            }
            guard doc.status == .waiting, doc.playerIDs.count == 1 else {
                throw GameServiceError.gameFull
            }

            let newState = GameEngine.newGame(
                playerID1: doc.hostID,
                playerName1: doc.hostName,
                playerID2: guestID,
                playerName2: guestName
            )
            doc.playerIDs = [doc.hostID, guestID]
            doc.status = .active
            doc.state = newState
            doc.updatedAt = Date()

            let data = try Firestore.Encoder().encode(doc)
            transaction.setData(data, forDocument: ref)
            return nil
        }
    }

    // MARK: - Realtime observation

    func observeGame(code: String) -> AsyncStream<GameDocument> {
        let ref = games.document(code.uppercased())
        return AsyncStream { continuation in
            let listener = ref.addSnapshotListener { snapshot, _ in
                guard let snapshot, snapshot.exists,
                      let doc = try? snapshot.data(as: GameDocument.self) else { return }
                continuation.yield(doc)
            }
            continuation.onTermination = { _ in listener.remove() }
        }
    }

    // MARK: - Gameplay

    func applyAction(_ action: GameAction, code: String, playerID: String) async throws {
        let ref = games.document(code.uppercased())
        try await runTransaction { transaction in
            let snapshot = try transaction.getDocument(ref)
            guard var doc = try? snapshot.data(as: GameDocument.self), let state = doc.state else {
                throw GameServiceError.invalidState
            }
            let newState = try GameEngine.apply(action, by: playerID, to: state)
            doc.state = newState
            doc.updatedAt = Date()
            if newState.isGameOver {
                doc.status = .finished
            }
            let data = try Firestore.Encoder().encode(doc)
            transaction.setData(data, forDocument: ref)
            return nil
        }
    }

    func startNextRound(code: String) async throws {
        let ref = games.document(code.uppercased())
        try await runTransaction { transaction in
            let snapshot = try transaction.getDocument(ref)
            guard var doc = try? snapshot.data(as: GameDocument.self), let state = doc.state else {
                throw GameServiceError.invalidState
            }
            guard state.isRoundOver, !state.isGameOver else { return nil }
            doc.state = GameEngine.startNextRound(from: state)
            doc.updatedAt = Date()
            let data = try Firestore.Encoder().encode(doc)
            transaction.setData(data, forDocument: ref)
            return nil
        }
    }

    // MARK: - Helpers

    private func write(_ doc: GameDocument, to ref: DocumentReference) async throws {
        let data = try Firestore.Encoder().encode(doc)
        try await ref.setData(data)
    }

    /// Runs `updateBlock` as a Firestore transaction, bridged to async/await.
    /// Uses the long-stable `(Transaction, NSErrorPointer) -> Any?` callback API
    /// rather than a Codable transaction convenience, since that surface has
    /// changed across Firebase SDK releases.
    @discardableResult
    private func runTransaction<T>(_ updateBlock: @escaping (Transaction) throws -> T?) async throws -> T? {
        try await withCheckedThrowingContinuation { continuation in
            db.runTransaction({ transaction, errorPointer -> Any? in
                do {
                    return try updateBlock(transaction)
                } catch {
                    errorPointer?.pointee = error as NSError
                    return nil
                }
            }, completion: { result, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: result as? T)
                }
            })
        }
    }

    private static func randomCode(length: Int = 5) -> String {
        // Excludes easily-confused characters (0/O, 1/I) so codes are easy to read aloud/type.
        let alphabet = Array("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")
        return String((0..<length).map { _ in alphabet.randomElement()! })
    }
}
