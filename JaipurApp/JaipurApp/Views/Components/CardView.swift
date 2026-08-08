import SwiftUI
import JaipurKit

struct CardView: View {
    let card: Card
    var isSelected: Bool = false
    var isDisabled: Bool = false
    var size: CGSize = CGSize(width: 64, height: 90)

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: card.good.symbolName)
                .font(.system(size: size.width * 0.32, weight: .semibold))
                .foregroundStyle(.white)
            Text(card.good.displayName)
                .font(.system(size: size.width * 0.14, weight: .semibold))
                .foregroundStyle(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .frame(width: size.width, height: size.height)
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [card.good.tint, card.good.tint.opacity(0.75)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .strokeBorder(isSelected ? Color.white : Color.black.opacity(0.15), lineWidth: isSelected ? 3 : 1)
        )
        .shadow(color: .black.opacity(0.25), radius: isSelected ? 6 : 3, y: 2)
        .scaleEffect(isSelected ? 1.08 : 1.0)
        .offset(y: isSelected ? -8 : 0)
        .opacity(isDisabled ? 0.4 : 1.0)
        .animation(.spring(response: 0.25, dampingFraction: 0.7), value: isSelected)
    }
}

struct CardBackView: View {
    var size: CGSize = CGSize(width: 64, height: 90)

    var body: some View {
        RoundedRectangle(cornerRadius: 10, style: .continuous)
            .fill(
                LinearGradient(
                    colors: [Color(red: 0.1, green: 0.35, blue: 0.32), Color(red: 0.06, green: 0.22, blue: 0.2)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(Color.white.opacity(0.6), lineWidth: 2)
                    .padding(4)
            )
            .overlay(
                Image(systemName: "sparkles")
                    .foregroundStyle(.white.opacity(0.85))
                    .font(.system(size: size.width * 0.26))
            )
            .frame(width: size.width, height: size.height)
            .shadow(color: .black.opacity(0.25), radius: 3, y: 2)
    }
}

#Preview {
    HStack {
        CardView(card: Card(good: .diamond), isSelected: true)
        CardView(card: Card(good: .leather))
        CardBackView()
    }
    .padding()
    .background(Color(red: 0.85, green: 0.6, blue: 0.35))
}
