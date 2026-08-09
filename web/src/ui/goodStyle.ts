import type { GoodType } from "../engine";

import camelCard from "../assets/cards/camel.jpg";
import diamondCard from "../assets/cards/diamond.jpg";
import goldCard from "../assets/cards/gold.jpg";
import silverCard from "../assets/cards/silver.jpg";
import clothCard from "../assets/cards/cloth.jpg";
import spiceCard from "../assets/cards/spice.jpg";
import leatherCard from "../assets/cards/leather.jpg";

import diamondToken from "../assets/tokens/diamond.png";
import goldToken from "../assets/tokens/gold.png";
import silverToken from "../assets/tokens/silver.png";
import clothToken from "../assets/tokens/cloth.png";
import spiceToken from "../assets/tokens/spice.png";
import leatherToken from "../assets/tokens/leather.png";

/**
 * Visual language for each good. `cardImage`/`tokenImage` are the artwork you
 * supplied - original illustrations in the Jaipur theme, not reproductions
 * of the publisher's cards. `emoji`/`color` remain as a fallback used only
 * where no image applies (there's no sellable token for camels).
 */
interface GoodStyle {
  label: string;
  emoji: string;
  color: string;
  cardImage: string;
  tokenImage?: string;
}

const STYLES: Record<GoodType, GoodStyle> = {
  camel: { label: "Kamel", emoji: "🐫", color: "#c79e61", cardImage: camelCard },
  diamond: { label: "Diamant", emoji: "💎", color: "#4dadd9", cardImage: diamondCard, tokenImage: diamondToken },
  gold: { label: "Guld", emoji: "🪙", color: "#dbad29", cardImage: goldCard, tokenImage: goldToken },
  silver: { label: "Silver", emoji: "🥈", color: "#9ea6ac", cardImage: silverCard, tokenImage: silverToken },
  cloth: { label: "Tyg", emoji: "🧵", color: "#8e52ad", cardImage: clothCard, tokenImage: clothToken },
  spice: { label: "Kryddor", emoji: "🌿", color: "#4f9e47", cardImage: spiceCard, tokenImage: spiceToken },
  leather: { label: "Läder", emoji: "👝", color: "#8c5c33", cardImage: leatherCard, tokenImage: leatherToken }
};

export function goodStyle(good: GoodType): GoodStyle {
  return STYLES[good];
}
