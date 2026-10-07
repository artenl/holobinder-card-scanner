import setIndex from "../../data/sets.json" with { type: "json" }
import { collectorNumber } from "../matching/text"
import type { Card, CardSet, Language } from "../types"
import { cardMatchesQuery, type CardCatalog, type CardQuery } from "./catalog"

const API = "https://api.tcgdex.net/v2"

/** Full card records cost one request each, so only this many are fetched per query. */
const MAX_CARDS_PER_QUERY = 20

/** The short card entries TCGdex returns in lists. */
interface TcgdexCardSummary {
  id: string
  localId: string
  name: string
}

interface TcgdexCard extends TcgdexCardSummary {
  hp?: number
  types?: string[]
  rarity?: string
  image?: string
  set: { id: string }
}

/**
 * A catalogue backed by TCGdex (https://tcgdex.dev), a free, open card database covering
 * international and Japanese sets. Set codes come from the bundled data/sets.json, so the
 * only network calls are card lookups. Responses are cached for the life of the instance.
 */
export class TcgdexCatalog implements CardCatalog {
  private readonly cache = new Map<string, Promise<unknown>>()

  async listSets(): Promise<CardSet[]> {
    return setIndex
  }

  async findCards(query: CardQuery): Promise<Card[]> {
    const summaries = query.setId
      ? await this.cardsInSet(query.language, query.setId)
      : await this.searchCards(query)

    const matching = summaries.filter((card) =>
      cardMatchesQuery({ name: card.name, number: card.localId }, query),
    )
    return Promise.all(
      matching.slice(0, MAX_CARDS_PER_QUERY).map((card) => this.getCard(query.language, card.id)),
    )
  }

  private async cardsInSet(language: Language, setId: string): Promise<TcgdexCardSummary[]> {
    const set = await this.get<{ cards: TcgdexCardSummary[] }>(
      `/${language}/sets/${encodeURIComponent(setId)}`,
    )
    return set?.cards ?? []
  }

  /** TCGdex filters are loose, case-insensitive "contains" matches; results are narrowed after. */
  private async searchCards({ language, name, number }: CardQuery): Promise<TcgdexCardSummary[]> {
    const params = new URLSearchParams()
    if (name) params.set("name", name)
    if (number) params.set("localId", collectorNumber(number))
    return (await this.get<TcgdexCardSummary[]>(`/${language}/cards?${params}`)) ?? []
  }

  private async getCard(language: Language, id: string): Promise<Card> {
    const card = await this.get<TcgdexCard>(`/${language}/cards/${encodeURIComponent(id)}`)
    if (!card) throw new Error(`TCGdex has no card ${id} in ${language}`)

    return {
      id: card.id,
      setId: card.set.id,
      number: card.localId,
      name: card.name,
      language,
      hp: card.hp ?? null,
      types: card.types ?? [],
      rarity: card.rarity ?? null,
      imageUrl: card.image ? `${card.image}/high.webp` : null,
    }
  }

  /** GET a TCGdex path, or null if it doesn't exist (e.g. a set not printed in that language). */
  private get<T>(path: string): Promise<T | null> {
    let request = this.cache.get(path)
    if (!request) {
      request = fetchJson(API + path).catch((error: unknown) => {
        this.cache.delete(path) // let a failed request be retried
        throw error
      })
      this.cache.set(path, request)
    }
    return request as Promise<T | null>
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`TCGdex request failed (${response.status}): ${url}`)
  return response.json()
}
