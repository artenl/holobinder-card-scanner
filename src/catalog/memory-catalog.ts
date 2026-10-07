import type { Card, CardSet } from "../types"
import { cardMatchesQuery, type CardCatalog, type CardQuery } from "./catalog"

/** A catalogue held in memory. Used by the tests; handy for a pre-loaded card list too. */
export class InMemoryCatalog implements CardCatalog {
  constructor(
    private readonly sets: CardSet[],
    private readonly cards: Card[],
  ) {}

  async listSets(): Promise<CardSet[]> {
    return this.sets
  }

  async findCards(query: CardQuery): Promise<Card[]> {
    return this.cards.filter(
      (card) =>
        card.language === query.language &&
        (!query.setId || card.setId === query.setId) &&
        cardMatchesQuery(card, query),
    )
  }
}
