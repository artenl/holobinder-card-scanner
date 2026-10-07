import { z } from "zod"
import { LANGUAGES } from "../types"

/**
 * What Claude reads off the photo. Passed to the API as a structured-output schema, so the
 * response is guaranteed to parse; the descriptions double as field-level instructions.
 */
export const CardReadingSchema = z.object({
  name: z.string().nullable().describe("Card name exactly as printed, in the card's own language"),
  setCode: z
    .string()
    .nullable()
    .describe("Set code printed at the bottom of the card, chosen from the known set codes"),
  setName: z.string().nullable().describe("Full set name, if you recognise the set"),
  number: z
    .string()
    .nullable()
    .describe('Collector number as printed, e.g. "006/064" or "SWSH001"'),
  language: z.enum(LANGUAGES).describe("Language the card is printed in"),
  pokemonType: z
    .enum([
      "Grass",
      "Fire",
      "Water",
      "Lightning",
      "Psychic",
      "Fighting",
      "Darkness",
      "Metal",
      "Dragon",
      "Fairy",
      "Colorless",
    ])
    .nullable()
    .describe("Energy type of a Pokémon card; null for Trainer and Energy cards"),
  hp: z.number().int().nullable().describe("HP printed at the top right"),
  rarity: z
    .string()
    .nullable()
    .describe('Rarity from the symbol, e.g. "Common", "Rare", "Ultra Rare"'),
  reasoning: z
    .string()
    .describe("One or two sentences on what you could read, especially the set code and number"),
  confidence: z.number().describe("Confidence in the identification, from 0 to 1"),
})

export type CardReading = z.infer<typeof CardReadingSchema>
