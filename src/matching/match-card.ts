import type { CardCatalog, CardQuery } from "../catalog/catalog"
import type { Card, CardMatch, CardSet } from "../types"
import type { CardReading } from "../vision/card-reading"
import { rankMatches } from "./rank"
import { editDistance, namesMatch, normalizeSetCode } from "./text"

/**
 * Base score for each kind of evidence. Ranking adds small bonuses on top.
 *
 * The name is printed large and is read reliably; set codes and numbers are printed small and
 * are where misreads happen. So a name that disagrees costs more than a number that is missing.
 */
export const SCORES = {
  /** Printed set code and number found, and the name agrees (or wasn't readable). */
  setAndNumber: 0.98,
  /** Set code was one character off, and the corrected set's card has the name Claude read. */
  correctedSetAndNumber: 0.93,
  /** Name found in the printed set: the number is missing or misread. */
  setAndName: 0.75,
  /** Printed set code and number found, but the name disagrees. */
  setAndNumberNameDiffers: 0.7,
  /** Set code was one character off, and nothing confirms the correction. */
  correctedSetUnconfirmed: 0.6,
  numberAndName: 0.5,
  nameOnly: 0.3,
} as const

/** Once any candidate reaches this score, the remaining strategies are skipped. */
const CONFIDENT = 0.9

interface MatchContext {
  reading: CardReading
  catalog: CardCatalog
  sets: CardSet[]
}

type Strategy = (context: MatchContext) => Promise<CardMatch[]>

/** From the most specific evidence to the least. */
const STRATEGIES: Strategy[] = [
  bySetCodeAndNumber,
  byCorrectedSetCodeAndNumber,
  bySetCodeAndName,
  byNumberAndName,
  byName,
]

/**
 * Finds the catalogue cards that best fit what Claude read off the card.
 *
 * Strategies run in order and their candidates add up until one is confident. A misread set
 * code that happens to exist (Claude reads "SV1a" on an "SV7a" card) therefore doesn't end the
 * search: the card it points to has a different name, so the corrected-code strategy still runs
 * and its candidate outranks the wrong one.
 */
export async function matchCard(reading: CardReading, catalog: CardCatalog): Promise<CardMatch[]> {
  const context: MatchContext = { reading, catalog, sets: await catalog.listSets() }
  const candidates: CardMatch[] = []

  for (const strategy of STRATEGIES) {
    candidates.push(...(await strategy(context)))
    if (candidates.some((candidate) => candidate.score >= CONFIDENT)) break
  }

  return rankMatches(keepBestPerCard(candidates), reading)
}

// ─── Strategies ──────────────────────────────────────────────────────────────

/** The printed set code and collector number: normally an exact identification. */
async function bySetCodeAndNumber({ reading, catalog, sets }: MatchContext): Promise<CardMatch[]> {
  const { setCode, number, name, language } = reading
  if (!setCode || !number) return []

  const cards = await findInSets(catalog, setsWithCode(sets, setCode), { language, number })
  return cards.map((card) => {
    if (name === null) return match(card, SCORES.setAndNumber, "set code", "card number")

    return namesMatch(name, card.name)
      ? match(card, SCORES.setAndNumber, "set code", "card number", "name")
      : match(card, SCORES.setAndNumberNameDiffers, "set code", "card number")
  })
}

/**
 * The set code with one character corrected. Printed codes are tiny and easy to misread
 * ("SV1a" for "SV7a", "S8b" for "S6b"), so every known code one edit away is tried, and the
 * name decides which correction is right.
 */
async function byCorrectedSetCodeAndNumber({
  reading,
  catalog,
  sets,
}: MatchContext): Promise<CardMatch[]> {
  const { setCode, number, name, language } = reading
  if (!setCode || !number) return []

  const read = normalizeSetCode(setCode)
  const nearbySets = sets.filter((set) => editDistance(read, normalizeSetCode(set.code)) === 1)

  const matches: CardMatch[] = []
  for (const set of nearbySets) {
    const correction = `set code corrected (${setCode} → ${set.code})`
    for (const card of await findInSets(catalog, [set], { language, number })) {
      matches.push(
        name !== null && namesMatch(name, card.name)
          ? match(card, SCORES.correctedSetAndNumber, correction, "card number", "name")
          : match(card, SCORES.correctedSetUnconfirmed, correction, "card number"),
      )
    }
  }
  return matches
}

/** The set is known but the number is missing or wrong: look for the name within the set. */
async function bySetCodeAndName({ reading, catalog, sets }: MatchContext): Promise<CardMatch[]> {
  const { setCode, name, language } = reading
  if (!setCode || !name) return []

  const cards = await findInSets(catalog, setsWithCode(sets, setCode), { language, name })
  return cards.map((card) => match(card, SCORES.setAndName, "set code", "name"))
}

/** No usable set code, which is common on older English cards that print only a set symbol. */
async function byNumberAndName({ reading, catalog }: MatchContext): Promise<CardMatch[]> {
  const { number, name, language } = reading
  if (!number || !name) return []

  const cards = await catalog.findCards({ language, number, name })
  return cards.map((card) => match(card, SCORES.numberAndName, "card number", "name"))
}

/** Last resort: every printing with this name. */
async function byName({ reading, catalog }: MatchContext): Promise<CardMatch[]> {
  const { name, language } = reading
  if (!name) return []

  const cards = await catalog.findCards({ language, name })
  return cards.map((card) => match(card, SCORES.nameOnly, "name"))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setsWithCode(sets: CardSet[], code: string): CardSet[] {
  const wanted = normalizeSetCode(code)
  return sets.filter((set) => normalizeSetCode(set.code) === wanted)
}

async function findInSets(
  catalog: CardCatalog,
  sets: CardSet[],
  query: Omit<CardQuery, "setId">,
): Promise<Card[]> {
  const results = await Promise.all(
    sets.map((set) => catalog.findCards({ ...query, setId: set.id })),
  )
  return results.flat()
}

function match(card: Card, score: number, ...reasons: string[]): CardMatch {
  return { card, score, reasons }
}

/** Two strategies can propose the same card; keep its strongest evidence. */
function keepBestPerCard(candidates: CardMatch[]): CardMatch[] {
  const best = new Map<string, CardMatch>()
  for (const candidate of candidates) {
    const current = best.get(candidate.card.id)
    if (!current || candidate.score > current.score) best.set(candidate.card.id, candidate)
  }
  return [...best.values()]
}
