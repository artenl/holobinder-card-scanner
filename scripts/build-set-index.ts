/**
 * Builds data/sets.json: every set the scanner can recognise by the code printed on its cards.
 *
 * International sets print an abbreviation ("SCR" for Stellar Crown) that differs from their
 * TCGdex id ("sv07"), so it is read from each set's detail endpoint. Japanese sets print their
 * TCGdex id as-is ("SV7a").
 *
 * Run with: npm run build:sets
 */
import { writeFile } from "node:fs/promises"
import type { CardSet } from "../src/types"

const API = "https://api.tcgdex.net/v2"

interface TcgdexSet {
  id: string
  name: string
  abbreviation?: { official?: string }
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(API + path)
  if (!response.ok) throw new Error(`GET ${path} failed with ${response.status}`)
  return (await response.json()) as T
}

async function internationalSets(): Promise<CardSet[]> {
  const sets: CardSet[] = []
  // One request at a time: TCGdex is a free community API.
  for (const { id } of await getJson<TcgdexSet[]>("/en/sets")) {
    const set = await getJson<TcgdexSet>(`/en/sets/${encodeURIComponent(id)}`)
    const code = set.abbreviation?.official
    if (code) sets.push({ id: set.id, code, name: set.name })
  }
  return sets
}

async function japaneseSets(): Promise<CardSet[]> {
  const sets = await getJson<TcgdexSet[]>("/ja/sets")
  return sets.map((set) => ({ id: set.id, code: set.id, name: set.name }))
}

const sets = [...(await internationalSets()), ...(await japaneseSets())].sort((a, b) =>
  a.code.localeCompare(b.code),
)

await writeFile(new URL("../data/sets.json", import.meta.url), JSON.stringify(sets, null, 2) + "\n")
console.log(`Wrote ${sets.length} sets to data/sets.json`)
