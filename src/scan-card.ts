import type { CardCatalog } from "./catalog/catalog"
import { TcgdexCatalog } from "./catalog/tcgdex-catalog"
import { prepareCardImages } from "./image/prepare-images"
import { matchCard } from "./matching/match-card"
import type { CardMatch } from "./types"
import type { CardReading } from "./vision/card-reading"
import { readCard, type ReadCardOptions } from "./vision/read-card"

export interface ScanOptions extends ReadCardOptions {
  /** Where to look cards up. Defaults to TCGdex. */
  catalog?: CardCatalog
}

export interface ScanResult {
  /** What Claude read off the card. */
  reading: CardReading
  /** Catalogue cards that fit the reading, best first. Empty if nothing fits. */
  matches: CardMatch[]
}

/**
 * Identifies a card from a photo:
 *   1. prepare a full image and an enlarged crop of the card's bottom edge,
 *   2. have Claude read the card, choosing the set code from the catalogue's known codes,
 *   3. match the reading against the catalogue, correcting misread set codes on the way.
 */
export async function scanCard(photo: Buffer, options: ScanOptions = {}): Promise<ScanResult> {
  const { catalog = new TcgdexCatalog(), ...readOptions } = options

  const [images, sets] = await Promise.all([prepareCardImages(photo), catalog.listSets()])
  const setCodes = [...new Set(sets.map((set) => set.code))]

  const reading = await readCard(images, setCodes, readOptions)
  const matches = await matchCard(reading, catalog)

  return { reading, matches }
}
