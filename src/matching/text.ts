/**
 * Small text comparisons used to line up what Claude read with what the catalogue stores.
 */

/** Levenshtein distance: how many single-character edits turn `a` into `b`. */
export function editDistance(a: string, b: string): number {
  // previous[j] is the distance between the first i-1 characters of a and the first j of b.
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j)

  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution)
    }
    previous = current
  }

  return previous[b.length]
}

/** Set codes are compared case-insensitively: "sv7a" and "SV7a" are the same set. */
export function normalizeSetCode(code: string): string {
  return code.trim().toLowerCase()
}

/**
 * The collector number without the set size or padding: "006/064" → "6".
 * Promo numbers keep their prefix: "SWSH001" → "SWSH001".
 */
export function collectorNumber(printed: string): string {
  const beforeSlash = printed.split("/")[0].trim().toUpperCase()
  return beforeSlash.replace(/^0+(?=.)/, "")
}

/** "006/064", "006" and "6" all refer to the same card in a set. */
export function sameCardNumber(a: string, b: string): boolean {
  return collectorNumber(a) === collectorNumber(b)
}

/**
 * Loose name comparison: either name contains the other, ignoring case, spacing and
 * full-width characters. "Charizard ex" matches "Charizard", "ピカチュウ" matches "ピカチュウ".
 */
export function namesMatch(a: string, b: string): boolean {
  const left = normalizeName(a)
  const right = normalizeName(b)
  if (!left || !right) return false
  return left.includes(right) || right.includes(left)
}

function normalizeName(name: string): string {
  return name.normalize("NFKC").toLowerCase().replace(/\s+/g, "")
}
