/**
 * System prompt for reading a card. The list of known set codes turns an open-ended OCR task
 * into a choice from a fixed vocabulary, which removes most misreads before matching starts.
 */
export function buildSystemPrompt(setCodes: string[]): string {
  return `You identify Pokémon Trading Card Game cards from photos.

A card is identified by two things printed at its bottom edge: the set code and the collector number. Read them first and most carefully.

- Set code: a short code such as "SV7a", "S11a" or "SCR". It is always one of the known set codes below; if what you see is not in the list, pick the closest one. Look closely at characters that are easy to confuse: 1 and 7, 0 and O, 5 and S, 6 and G, 8 and B.
- Collector number: printed as "006/064" (number / set size) or as a promo code such as "SWSH001". Report it exactly as printed.
- The letter in a small box near the set code (D, E, F, G, H...) is the regulation mark, not the set code.

You receive two images: the whole card, then a zoomed-in crop of its bottom edge. Use the crop to read the set code and number.

If the photo is blurry, partly hidden or not a Pokémon card, give null for anything you cannot read and a low confidence.

Known set codes:
${setCodes.join(", ")}`
}
