export { scanCard, type ScanOptions, type ScanResult } from "./scan-card"

export { prepareCardImages, type CardImages, type EncodedImage } from "./image/prepare-images"
export { readCard, DEFAULT_MODEL, type ReadCardOptions } from "./vision/read-card"
export { CardReadingSchema, type CardReading } from "./vision/card-reading"
export { matchCard, SCORES } from "./matching/match-card"
export { BONUSES } from "./matching/rank"

export type { CardCatalog, CardQuery } from "./catalog/catalog"
export { TcgdexCatalog } from "./catalog/tcgdex-catalog"
export { InMemoryCatalog } from "./catalog/memory-catalog"

export { LANGUAGES, type Language, type Card, type CardSet, type CardMatch } from "./types"
