import SwiftUI
import JaipurKit

/// Visual language for each good, used everywhere a card/token needs a color or icon.
/// There's no licensed Jaipur artwork here (that's the publisher's IP) - this maps
/// each good to an SF Symbol + color pairing that reads clearly at a glance. Swap
/// `icon`/`iconImage` for real illustrations in Assets.xcassets once you have them
/// (or commissioned equivalents) and the rest of the UI needs no changes.
extension GoodType {
    var displayName: String {
        switch self {
        case .camel: return "Camel"
        case .diamond: return "Diamonds"
        case .gold: return "Gold"
        case .silver: return "Silver"
        case .cloth: return "Cloth"
        case .spice: return "Spice"
        case .leather: return "Leather"
        }
    }

    var symbolName: String {
        switch self {
        case .camel: return "figure.walk"
        case .diamond: return "diamond.fill"
        case .gold: return "cube.fill"
        case .silver: return "circle.hexagongrid.fill"
        case .cloth: return "square.stack.fill"
        case .spice: return "leaf.fill"
        case .leather: return "bag.fill"
        }
    }

    var tint: Color {
        switch self {
        case .camel: return Color(red: 0.78, green: 0.62, blue: 0.38)
        case .diamond: return Color(red: 0.30, green: 0.68, blue: 0.86)
        case .gold: return Color(red: 0.86, green: 0.68, blue: 0.16)
        case .silver: return Color(red: 0.62, green: 0.65, blue: 0.68)
        case .cloth: return Color(red: 0.56, green: 0.32, blue: 0.68)
        case .spice: return Color(red: 0.31, green: 0.62, blue: 0.28)
        case .leather: return Color(red: 0.55, green: 0.36, blue: 0.20)
        }
    }
}
