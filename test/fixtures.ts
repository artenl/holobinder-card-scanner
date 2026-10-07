import { InMemoryCatalog } from "../src/catalog/memory-catalog"
import type { Card, CardSet } from "../src/types"
import type { CardReading } from "../src/vision/card-reading"

// Real sets and cards from TCGdex. SV7a, SV1a and SV1S are one character apart from each
// other, and each has a different card at number 006: the classic misread scenario.

export const sets: CardSet[] = [
  { id: "SV7a", code: "SV7a", name: "楽園ドラゴーナ" },
  { id: "SV1a", code: "SV1a", name: "トリプレットビート" },
  { id: "SV1S", code: "SV1S", name: "スカーレットex" },
  { id: "sv07", code: "SCR", name: "Stellar Crown" },
  { id: "sv08", code: "SSP", name: "Surging Sparks" },
]

export const cards: Card[] = [
  card("SV7a", "006", "ポワルン たいようのすがた", "ja", { hp: 70, types: ["Fire"] }),
  card("SV1a", "006", "ニャローテ", "ja", { hp: 90, types: ["Grass"] }),
  card("SV1S", "006", "ミニーブ", "ja", { hp: 60, types: ["Grass"] }),
  card("sv07", "006", "Cradily", "en", { hp: 150, types: ["Grass"], rarity: "Rare" }),
  card("sv08", "006", "Spewpa", "en", { hp: 80, types: ["Grass"] }),
  card("sv08", "057", "Pikachu ex", "en", { hp: 200, types: ["Lightning"], rarity: "Double rare" }),
  // Base Set (1999) prints no set code; it is left out of the set list to test that path.
  card("base1", "4", "Charizard", "en", { hp: 120, types: ["Fire"], rarity: "Rare" }),
  card("base1", "58", "Pikachu", "en", { hp: 40, types: ["Lightning"] }),
]

export const catalog = new InMemoryCatalog(sets, cards)

/** A reading with nothing detected; override the fields a test cares about. */
export function reading(fields: Partial<CardReading>): CardReading {
  return {
    name: null,
    setCode: null,
    setName: null,
    number: null,
    language: "en",
    pokemonType: null,
    hp: null,
    rarity: null,
    reasoning: "",
    confidence: 0.9,
    ...fields,
  }
}

function card(
  setId: string,
  number: string,
  name: string,
  language: Card["language"],
  details: { hp: number; types: string[]; rarity?: string },
): Card {
  return {
    id: `${setId}-${number}`,
    setId,
    number,
    name,
    language,
    hp: details.hp,
    types: details.types,
    rarity: details.rarity ?? "Common",
    imageUrl: null,
  }
}
