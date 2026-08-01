// One-time asset generation, not part of the build. Run manually with:
//   set -a; source .env.local; set +a; npx tsx scripts/generate-tts.ts
// Produces the static audio clips lib/tts.ts plays instantly during a
// round - re-run after adding new words to the prompt bank.

import fs from "node:fs";
import path from "node:path";
import { PROMPT_BANK } from "../lib/prompts";
import { slugify } from "../lib/audioSlug";
import { FIXED_PHRASES } from "../lib/ttsPhrases";

const VOICE_ID = "Zjz30d9v1e5xCxNVTni6";
const MODEL_ID = "eleven_multilingual_v2";
const OUT_DIR = path.join(process.cwd(), "public", "audio");

async function generate(text: string) {
  const slug = slugify(text);
  const outPath = path.join(OUT_DIR, `${slug}.mp3`);
  if (fs.existsSync(outPath)) {
    console.log(`skip (exists): ${text}`);
    return;
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, model_id: MODEL_ID }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed for "${text}": ${res.status} ${await res.text()}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  console.log(`generated: ${text} -> ${slug}.mp3 (${buf.length} bytes)`);
}

async function main() {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not set in the environment.");
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const words = Array.from(new Set(Object.values(PROMPT_BANK).flat()));
  const allTexts = [...words, ...FIXED_PHRASES];

  for (const text of allTexts) {
    await generate(text);
    // Courtesy delay, not required by ElevenLabs - just avoids hammering
    // the API with 100+ requests back to back.
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`done - ${allTexts.length} clips total`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
