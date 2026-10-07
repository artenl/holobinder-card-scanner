import sharp from "sharp"
import { describe, expect, it } from "vitest"
import { prepareCardImages, type EncodedImage } from "../src/image/prepare-images"

/** A plain photo-sized JPEG, optionally tagged with an EXIF orientation. */
async function photo(width: number, height: number, orientation?: number): Promise<Buffer> {
  const image = sharp({ create: { width, height, channels: 3, background: "#d4af37" } }).jpeg()
  return orientation ? image.withMetadata({ orientation }).toBuffer() : image.toBuffer()
}

async function size(image: EncodedImage) {
  const { width, height } = await sharp(Buffer.from(image.data, "base64")).metadata()
  return { width, height }
}

describe("prepareCardImages", () => {
  it("shrinks the full image to at most 1536px, keeping its proportions", async () => {
    const { full } = await prepareCardImages(await photo(3000, 4200))

    expect(full.mediaType).toBe("image/jpeg")
    expect(await size(full)).toEqual({ width: 1097, height: 1536 })
  })

  it("crops the bottom 30% of the card and enlarges it to 1536px wide", async () => {
    const { bottom } = await prepareCardImages(await photo(3000, 4200))

    // 30% of 4200px is 1260px, scaled by 1536 / 3000.
    expect(await size(bottom)).toEqual({ width: 1536, height: 645 })
  })

  it("never upscales a small photo", async () => {
    const { full, bottom } = await prepareCardImages(await photo(600, 840))

    expect(await size(full)).toEqual({ width: 600, height: 840 })
    expect(await size(bottom)).toEqual({ width: 600, height: 252 })
  })

  it("applies the camera's EXIF rotation before cropping", async () => {
    // Stored sideways (4200 × 3000) with orientation 6 = "rotate 90° to display".
    const { full } = await prepareCardImages(await photo(4200, 3000, 6))

    expect(await size(full)).toEqual({ width: 1097, height: 1536 })
  })
})
