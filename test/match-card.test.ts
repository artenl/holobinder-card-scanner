import { describe, expect, it } from "vitest"
import type { CardQuery } from "../src/catalog/catalog"
import { InMemoryCatalog } from "../src/catalog/memory-catalog"
import { matchCard, SCORES } from "../src/matching/match-card"
import { catalog, cards, reading, sets } from "./fixtures"

describe("matchCard", () => {
  it("identifies a card from its set code and number", async () => {
    const matches = await matchCard(
      reading({
        setCode: "SV7a",
        number: "006/064",
        name: "ポワルン たいようのすがた",
        language: "ja",
      }),
      catalog,
    )

    expect(matches[0].card.id).toBe("SV7a-006")
    expect(matches[0].score).toBeGreaterThanOrEqual(SCORES.setAndNumber)
    expect(matches[0].reasons).toEqual(["set code", "card number", "name"])
  })

  it("corrects a set code that doesn't exist (5 read for S)", async () => {
    const matches = await matchCard(
      reading({
        setCode: "5V7a",
        number: "006/064",
        name: "ポワルン たいようのすがた",
        language: "ja",
      }),
      catalog,
    )

    expect(matches[0].card.id).toBe("SV7a-006")
    expect(matches[0].reasons).toContain("set code corrected (5V7a → SV7a)")
  })

  it("corrects a misread set code even when the misread code is a real set", async () => {
    // "SV7a" read as "SV1a": SV1a exists and has a card 006, but it's a different Pokémon.
    const matches = await matchCard(
      reading({
        setCode: "SV1a",
        number: "006/064",
        name: "ポワルン たいようのすがた",
        language: "ja",
      }),
      catalog,
    )

    expect(matches.map((match) => match.card.id)).toEqual(["SV7a-006", "SV1a-006", "SV1S-006"])
    expect(matches[0].reasons).toContain("set code corrected (SV1a → SV7a)")
  })

  it("uses the name to choose between nearby set codes", async () => {
    // "SV1x" is one edit away from both SV1a and SV1S.
    const matches = await matchCard(
      reading({ setCode: "SV1x", number: "006", name: "ミニーブ", language: "ja" }),
      catalog,
    )

    expect(matches[0].card.id).toBe("SV1S-006")
    expect(matches[0].score).toBeGreaterThan(matches[1].score)
  })

  it("trusts the printed set code over an unconfirmed correction", async () => {
    // The name matches nothing (English name on a Japanese card), so no correction is confirmed.
    const matches = await matchCard(
      reading({ setCode: "SV1a", number: "006/073", name: "Floragato", language: "ja" }),
      catalog,
    )

    expect(matches[0].card.id).toBe("SV1a-006")
    expect(matches[0].score).toBe(SCORES.setAndNumberNameDiffers)
  })

  it("finds the card by name within the set when the number doesn't match", async () => {
    const matches = await matchCard(
      reading({ setCode: "SCR", number: "009/142", name: "Cradily", hp: 150 }),
      catalog,
    )

    expect(matches[0].card.id).toBe("sv07-006")
    expect(matches[0].reasons).toEqual(["set code", "name", "HP"])
  })

  it("matches by number and name when the card prints no set code", async () => {
    const matches = await matchCard(reading({ number: "4/102", name: "Charizard" }), catalog)

    expect(matches[0].card.id).toBe("base1-4")
    expect(matches[0].reasons).toEqual(["card number", "name"])
  })

  it("falls back to the name alone, using HP and type to rank", async () => {
    const matches = await matchCard(
      reading({ name: "Pikachu", hp: 200, pokemonType: "Lightning" }),
      catalog,
    )

    expect(matches.map((match) => match.card.id)).toEqual(["sv08-057", "base1-58"])
    expect(matches[0].reasons).toEqual(["name", "HP", "type"])
  })

  it("only looks at cards printed in the card's language", async () => {
    const matches = await matchCard(
      reading({ setCode: "SV7a", number: "006/064", name: "Castform", language: "en" }),
      catalog,
    )

    expect(matches).toEqual([])
  })

  it("returns nothing when nothing fits", async () => {
    expect(await matchCard(reading({ name: "Missingno" }), catalog)).toEqual([])
  })

  it("stops searching once a match is confident", async () => {
    const queries: CardQuery[] = []
    const recordingCatalog = new InMemoryCatalog(sets, cards)
    const findCards = recordingCatalog.findCards.bind(recordingCatalog)
    recordingCatalog.findCards = (query) => {
      queries.push(query)
      return findCards(query)
    }

    await matchCard(
      reading({ setCode: "SCR", number: "006/142", name: "Cradily" }),
      recordingCatalog,
    )

    expect(queries).toEqual([{ language: "en", setId: "sv07", number: "006/142" }])
  })
})
