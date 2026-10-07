/** Languages cards are printed in, using TCGdex's language codes. */
export const LANGUAGES = ["en", "fr", "de", "it", "es", "pt", "ja", "ko", "zh-tw", "zh-cn"] as const
export type Language = (typeof LANGUAGES)[number]

/** A card set, recognised by the code printed at the bottom of its cards. */
export interface CardSet {
  /** Catalogue id, e.g. "sv07". */
  id: string
  /** Code printed on the card, e.g. "SCR" on English cards or "SV7a" on Japanese ones. */
  code: string
  name: string
}

/** One printing of a card, in one language. */
export interface Card {
  id: string
  setId: string
  /** Collector number as the catalogue stores it, e.g. "006". */
  number: string
  name: string
  language: Language
  hp: number | null
  types: string[]
  rarity: string | null
  imageUrl: string | null
}

/** A catalogue card proposed as the scanned card. */
export interface CardMatch {
  card: Card
  /** Confidence from 0 to 1. */
  score: number
  /** The evidence behind the score, e.g. ["set code", "card number", "name"]. */
  reasons: string[]
}
