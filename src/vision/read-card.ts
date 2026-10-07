import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import type { CardImages, EncodedImage } from "../image/prepare-images"
import { CardReadingSchema, type CardReading } from "./card-reading"
import { buildSystemPrompt } from "./prompt"

export const DEFAULT_MODEL = "claude-opus-5-5"

export interface ReadCardOptions {
  /** Defaults to a client configured from ANTHROPIC_API_KEY. */
  client?: Anthropic
  model?: string
}

/** Asks Claude to read the name, set code, collector number and details off a card photo. */
export async function readCard(
  images: CardImages,
  setCodes: string[],
  { client = new Anthropic(), model = DEFAULT_MODEL }: ReadCardOptions = {},
): Promise<CardReading> {
  const response = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    // If a safety classifier declines the request, the API retries it on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: betaZodOutputFormat(CardReadingSchema),
    },
    system: buildSystemPrompt(setCodes),
    messages: [
      {
        role: "user",
        content: [
          imageBlock(images.full),
          imageBlock(images.bottom),
          { type: "text", text: "Identify this card." },
        ],
      },
    ],
  })

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined to read this image.")
  }
  if (!response.parsed_output) {
    throw new Error(`Claude returned no card reading (stop reason: ${response.stop_reason}).`)
  }
  return response.parsed_output
}

function imageBlock(image: EncodedImage): Anthropic.Beta.BetaImageBlockParam {
  return {
    type: "image",
    source: { type: "base64", media_type: image.mediaType, data: image.data },
  }
}
