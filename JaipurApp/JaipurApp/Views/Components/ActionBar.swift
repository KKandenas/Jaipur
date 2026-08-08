import SwiftUI

enum ActionMode: Equatable {
    case none
    case exchanging
    case selling
}

struct ActionBar: View {
    let mode: ActionMode
    let isMyTurn: Bool
    let canTakeCamels: Bool
    let canConfirmExchange: Bool
    let canConfirmSell: Bool
    let isSubmitting: Bool

    let onTakeCamels: () -> Void
    let onStartExchange: () -> Void
    let onStartSell: () -> Void
    let onConfirm: () -> Void
    let onCancel: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            switch mode {
            case .none:
                actionButton("Take Camels", systemImage: "figure.walk", disabled: !isMyTurn || !canTakeCamels, action: onTakeCamels)
                actionButton("Trade", systemImage: "arrow.left.arrow.right", disabled: !isMyTurn, action: onStartExchange)
                actionButton("Sell", systemImage: "banknote.fill", disabled: !isMyTurn, action: onStartSell)
            case .exchanging:
                Text("Pick 2–5 market cards, then match with hand cards + camels.")
                    .font(.caption)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, alignment: .leading)
                actionButton("Cancel", systemImage: "xmark", disabled: false, style: .secondary, action: onCancel)
                actionButton("Confirm", systemImage: "checkmark", disabled: !canConfirmExchange, action: onConfirm)
            case .selling:
                Text("Pick cards of one good to sell.")
                    .font(.caption)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, alignment: .leading)
                actionButton("Cancel", systemImage: "xmark", disabled: false, style: .secondary, action: onCancel)
                actionButton("Confirm", systemImage: "checkmark", disabled: !canConfirmSell, action: onConfirm)
            }
        }
        .opacity(isSubmitting ? 0.5 : 1)
        .disabled(isSubmitting)
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.black.opacity(0.3))
        )
    }

    private enum ButtonStyleKind { case primary, secondary }

    private func actionButton(
        _ title: String,
        systemImage: String,
        disabled: Bool,
        style: ButtonStyleKind = .primary,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .font(.subheadline.bold())
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
        }
        .buttonStyle(.borderedProminent)
        .tint(style == .primary ? Color(red: 0.72, green: 0.24, blue: 0.18) : Color.gray)
        .disabled(disabled)
    }
}
