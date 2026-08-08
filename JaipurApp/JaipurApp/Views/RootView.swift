import SwiftUI

struct RootView: View {
    @EnvironmentObject private var session: SessionViewModel

    var body: some View {
        Group {
            if let code = session.activeGameCode, let uid = session.userID {
                NavigationStack {
                    GameView(code: code, myID: uid)
                }
            } else {
                LobbyView()
            }
        }
        .task {
            if session.userID == nil {
                await session.start()
            }
        }
    }
}
