import type { CardMatch } from "../types"
import type { CardReading } from "../vision/card-reading"
import { namesMatch } from "./text"

/** Bonuses for secondary details that agree. They break ties; they never outweigh a set code. */
export const BONUSES = {
  name: 0.08,
  HP: 0.05,
  type: 0.03,
  rarity: 0.02,
} as const

type Detail = keyof typeof BONUSES

const MAX_RESULTS = 5

/** Adds bonuses for agreeing details, then returns the best few candidates, best first. */
export function rankMatches(candidates: CardMatch[], reading: CardReading): CardMatch[] {
  return candidates
    .map((candidate) => withBonuses(candidate, reading))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
}

function withBonuses({ card, score, reasons }: CardMatch, reading: CardReading): CardMatch {
  const agreeing: Detail[] = []
  const type = reading.pokemonType?.toLowerCase()

  if (reading.name && !reasons.includes("name") && namesMatch(reading.name, card.name)) {
    agreeing.push("name")
  }
  if (reading.hp !== null && reading.hp === card.hp) {
    agreeing.push("HP")
  }
  if (type && card.types.some((cardType) => cardType.toLowerCase() === type)) {
    agreeing.push("type")
  }
  if (reading.rarity && card.rarity && namesMatch(reading.rarity, card.rarity)) {
    agreeing.push("rarity")
  }

  const bonus = agreeing.reduce((total, detail) => total + BONUSES[detail], 0)
  return {
    card,
    score: Math.round(Math.min(1, score + bonus) * 100) / 100,
    reasons: [...reasons, ...agreeing],
  }
}
