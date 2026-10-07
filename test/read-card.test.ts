import type Anthropic from "@anthropic-ai/sdk"
import { describe, expect, it } from "vitest"
import type { CardImages } from "../src/image/prepare-images"
import { readCard } from "../src/vision/read-card"
import { reading } from "./fixtures"

const images: CardImages = {
  full: { data: "RlVMTA==", mediaType: "image/jpeg" },
  bottom: { data: "Qk9UVE9N", mediaType: "image/jpeg" },
}

/** Stands in for the Anthropic client: records the request and returns a canned response. */
function fakeClient(response: object) {
  const requests: Anthropic.Beta.MessageCreateParamsNonStreaming[] = []
  const client = {
    beta: {
      messages: {
        parse: async (params: Anthropic.Beta.MessageCreateParamsNonStreaming) => {
          requests.push(params)
          return response
        },
      },
    },
  } as unknown as Anthropic
  return { client, requests }
}

describe("readCard", () => {
  it("sends the full card, then the bottom crop, with the known set codes in the prompt", async () => {
    const { client, requests } = fakeClient({ stop_reason: "end_turn", parsed_output: reading({}) })

    await readCard(images, ["SV7a", "SCR"], { client })

    const [request] = requests
    expect(request.system).toContain("SV7a, SCR")
    expect(request.messages[0].content).toMatchObject([
      { type: "image", source: { data: "RlVMTA==" } },
      { type: "image", source: { data: "Qk9UVE9N" } },
      { type: "text" },
    ])
  })

  it("returns the parsed reading", async () => {
    const expected = reading({ name: "Cradily", setCode: "SCR", number: "006/142" })
    const { client } = fakeClient({ stop_reason: "end_turn", parsed_output: expected })

    expect(await readCard(images, [], { client })).toEqual(expected)
  })

  it("throws when Claude declines the request", async () => {
    const { client } = fakeClient({ stop_reason: "refusal", parsed_output: null })

    await expect(readCard(images, [], { client })).rejects.toThrow("declined")
  })
})
