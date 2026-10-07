/**
 * Identify a card from a photo.
 *
 *   npm run scan -- path/to/card.jpg
 *
 * Needs ANTHROPIC_API_KEY in the environment or in a .env file.
 */
import { readFile } from "node:fs/promises"
import { scanCard } from "../src/index"

try {
  process.loadEnvFile()
} catch {
  // No .env file: the key must already be in the environment.
}

const path = process.argv[2]
if (!path) {
  console.error("Usage: npm run scan -- <photo of a card>")
  process.exit(1)
}

const { reading, matches } = await scanCard(await readFile(path))

console.log("Claude read:")
console.log(
  `  ${reading.name ?? "unknown name"} · set ${reading.setCode ?? "?"} · no. ${reading.number ?? "?"} · ${reading.language}`,
)
console.log(`  ${reading.reasoning} (confidence ${reading.confidence})`)
console.log()

if (matches.length === 0) {
  console.log("No matching card found.")
} else {
  console.log("Best matches:")
  for (const { card, score, reasons } of matches) {
    console.log(`  ${score.toFixed(2)}  ${card.name} (${card.id})`)
    console.log(`        ← ${reasons.join(", ")}`)
  }
}
