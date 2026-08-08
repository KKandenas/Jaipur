import SwiftUI

struct LobbyView: View {
    @EnvironmentObject private var session: SessionViewModel
    @StateObject private var viewModel = LobbyViewModel()
    @FocusState private var nameFieldFocused: Bool

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(red: 0.86, green: 0.58, blue: 0.32), Color(red: 0.6, green: 0.32, blue: 0.18)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        VStack(spacing: 4) {
                            Text("Jaipur")
                                .font(.system(size: 44, weight: .heavy, design: .serif))
                            Text("A two-player caravan of trading")
                                .font(.subheadline)
                        }
                        .foregroundStyle(.white)
                        .padding(.top, 40)

                        card {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Your name").font(.headline)
                                TextField("Trader name", text: Binding(
                                    get: { session.displayName },
                                    set: { session.updateDisplayName($0) }
                                ))
                                .textFieldStyle(.roundedBorder)
                                .focused($nameFieldFocused)
                            }
                        }

                        card {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Start a new game").font(.headline)
                                Text("You'll get a 5-character code to share with your opponent.")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Button {
                                    Task { await createGame() }
                                } label: {
                                    Label("Create Game", systemImage: "plus.circle.fill")
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 6)
                                }
                                .buttonStyle(.borderedProminent)
                                .disabled(viewModel.isWorking)
                            }
                        }

                        card {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Join a game").font(.headline)
                                TextField("Game code", text: $viewModel.joinCodeInput)
                                    .textFieldStyle(.roundedBorder)
                                    .textInputAutocapitalization(.characters)
                                    .autocorrectionDisabled()
                                Button {
                                    Task { await joinGame() }
                                } label: {
                                    Label("Join Game", systemImage: "arrow.right.circle.fill")
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 6)
                                }
                                .buttonStyle(.bordered)
                                .disabled(viewModel.isWorking)
                            }
                        }

                        if viewModel.isWorking {
                            ProgressView().tint(.white)
                        }
                        if let error = viewModel.errorMessage {
                            Text(error)
                                .font(.footnote)
                                .foregroundStyle(.red)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }
                        if let startupError = session.startupError {
                            Text("Sign-in failed: \(startupError)")
                                .font(.footnote)
                                .foregroundStyle(.red)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
                }
            }
        }
    }

    private func card<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .padding(16)
            .frame(maxWidth: 420)
            .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Color(.systemBackground)))
            .shadow(radius: 8)
    }

    private func createGame() async {
        guard let uid = await ensureSignedIn() else { return }
        if let code = await viewModel.createGame(userID: uid, displayName: session.displayName) {
            session.activeGameCode = code
        }
    }

    private func joinGame() async {
        guard let uid = await ensureSignedIn() else { return }
        if let code = await viewModel.joinGame(userID: uid, displayName: session.displayName) {
            session.activeGameCode = code
        }
    }

    private func ensureSignedIn() async -> String? {
        if session.userID == nil {
            await session.start()
        }
        return session.userID
    }
}
