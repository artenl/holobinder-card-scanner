import { describe, expect, it } from "vitest"
import { collectorNumber, editDistance, namesMatch, sameCardNumber } from "../src/matching/text"

describe("editDistance", () => {
  it.each([
    ["sv7a", "sv7a", 0],
    ["sv7a", "sv1a", 1], // substitution: 7 read as 1
    ["sv7a", "sv7", 1], // deletion
    ["s11", "s11a", 1], // insertion
    ["kitten", "sitting", 3],
    ["", "scr", 3],
  ])("%s → %s is %i", (a, b, distance) => {
    expect(editDistance(a, b)).toBe(distance)
  })
})

describe("collectorNumber", () => {
  it.each([
    ["006/064", "6"],
    ["006", "6"],
    ["6", "6"],
    ["000", "0"],
    [" tg05 / tg30 ", "TG05"],
    ["SWSH001", "SWSH001"],
  ])("%s → %s", (printed, expected) => {
    expect(collectorNumber(printed)).toBe(expected)
  })
})

describe("sameCardNumber", () => {
  it("ignores the set size and zero padding", () => {
    expect(sameCardNumber("006/064", "6")).toBe(true)
    expect(sameCardNumber("006/064", "006")).toBe(true)
  })

  it("tells different numbers apart", () => {
    expect(sameCardNumber("006/064", "060")).toBe(false)
  })
})

describe("namesMatch", () => {
  it("ignores case and spacing", () => {
    expect(namesMatch("PIKACHU EX", "Pikachu ex")).toBe(true)
    expect(namesMatch("リザードン ex", "リザードンex")).toBe(true)
  })

  it("accepts a name contained in the other", () => {
    expect(namesMatch("Charizard", "Charizard ex")).toBe(true)
  })

  it("treats full-width and half-width characters as equal", () => {
    expect(namesMatch("Ｐｉｋａｃｈｕ", "Pikachu")).toBe(true)
  })

  it("never matches an empty name", () => {
    expect(namesMatch("", "Pikachu")).toBe(false)
  })

  it("rejects different names", () => {
    expect(namesMatch("Cradily", "Spewpa")).toBe(false)
  })
})
