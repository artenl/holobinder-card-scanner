import sharp from "sharp"

export interface EncodedImage {
  /** Base64 without a data: prefix. */
  data: string
  mediaType: "image/jpeg"
}

export interface CardImages {
  /** The whole card, for the name, artwork, HP and type. */
  full: EncodedImage
  /** The bottom of the card, enlarged, where the set code and collector number are printed. */
  bottom: EncodedImage
}

/** Long edge of the images sent to Claude. Larger photos cost more tokens without reading better. */
const MAX_DIMENSION = 1536
/** Share of the card's height kept in the bottom crop. */
const BOTTOM_SHARE = 0.3

/**
 * Turns a photo into the two images Claude receives. The set code and number are only a few
 * pixels tall in a full-card photo; a separate crop of the bottom edge gives them far more
 * resolution, which is what fixes most misreads.
 */
export async function prepareCardImages(photo: Buffer): Promise<CardImages> {
  // Apply the EXIF orientation first, so "bottom" means the bottom of the card as seen.
  const { data: upright, info } = await sharp(photo).rotate().toBuffer({ resolveWithObject: true })

  const full = await sharp(upright)
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer()

  const top = Math.round(info.height * (1 - BOTTOM_SHARE))
  const bottom = await sharp(upright)
    .extract({ left: 0, top, width: info.width, height: info.height - top })
    .resize({ width: MAX_DIMENSION, withoutEnlargement: true })
    // Higher quality: this image exists to keep small text sharp.
    .jpeg({ quality: 92 })
    .toBuffer()

  return { full: encode(full), bottom: encode(bottom) }
}

function encode(jpeg: Buffer): EncodedImage {
  return { data: jpeg.toString("base64"), mediaType: "image/jpeg" }
}
