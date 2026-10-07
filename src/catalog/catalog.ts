import { namesMatch, sameCardNumber } from "../matching/text"
import type { Card, CardSet, Language } from "../types"

/** Filters for a card lookup. Every filter that is set must match. */
export interface CardQuery {
  language: Language
  setId?: string
  /** Printed collector number. "006/064", "006" and "6" are equivalent. */
  number?: string
  /** Loose name match (see `namesMatch`). */
  name?: string
}

/**
 * Where cards are looked up. HoloBinder uses its own Postgres database; this repository ships
 * a TCGdex-backed catalogue for real use and an in-memory one for tests.
 */
export interface CardCatalog {
  /** Every set that can be recognised by its printed code. */
  listSets(): Promise<CardSet[]>
  findCards(query: CardQuery): Promise<Card[]>
}

/** Shared filter logic, so every catalogue interprets a query the same way. */
export function cardMatchesQuery(card: Pick<Card, "number" | "name">, query: CardQuery): boolean {
  if (query.number && !sameCardNumber(query.number, card.number)) return false
  if (query.name && !namesMatch(query.name, card.name)) return false
  return true
}
