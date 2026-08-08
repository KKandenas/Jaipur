import type { GoodType } from "../engine";

/**
 * Visual language for each good. There's no licensed Jaipur artwork here
 * (that's the publisher's IP) - goods are represented with an emoji + color
 * pairing, which renders crisply and consistently on iOS/iPadOS without
 * shipping any image assets. Swap `emoji` for a real illustration whenever
 * you have one (commissioned or licensed); everything else keeps working.
 */
interface GoodStyle {
  label: string;
  emoji: string;
  color: string;
}

const STYLES: Record<GoodType, GoodStyle> = {
  camel: { label: "Camel", emoji: "🐫", color: "#c79e61" },
  diamond: { label: "Diamonds", emoji: "💎", color: "#4dadd9" },
  gold: { label: "Gold", emoji: "🪙", color: "#dbad29" },
  silver: { label: "Silver", emoji: "🥈", color: "#9ea6ac" },
  cloth: { label: "Cloth", emoji: "🧵", color: "#8e52ad" },
  spice: { label: "Spice", emoji: "🌿", color: "#4f9e47" },
  leather: { label: "Leather", emoji: "👝", color: "#8c5c33" }
};

export function goodStyle(good: GoodType): GoodStyle {
  return STYLES[good];
}
