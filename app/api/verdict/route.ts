import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Answer = { prompt: string; text: string };

export async function POST(req: NextRequest) {
  const { name, answers } = (await req.json()) as {
    name: string;
    answers: Answer[];
  };

  const transcript = answers.map((a) => `${a.prompt} -> ${a.text}`).join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 1.0,
    messages: [
      {
        role: "system",
        content: `You are the witty voiceover artist for a Bollywood-flavored rapid-fire word-association party game called THE NEELAM SHOW. Players hear a word and blurt the first thing that comes to mind, back to back for 60 seconds.

Your job after each round: read their list of prompt->answer pairs like a dramatic Bollywood film critic reviewing someone's brain as if it were a movie. Be genuinely funny, a little dramatic, a little cheeky - think movie-poster tagline energy, not a generic compliment. Reference their SPECIFIC answers, don't write generic filler that could apply to anyone.

Return strict JSON only, matching this shape exactly:
{
  "verdict": "ONE short, elegant, dramatic sentence in an italic movie-tagline voice - reads like a poster quote, references 1-2 of their specific answers. Hard limit: 16 words or fewer, this sits on a small card and cannot wrap more than 3-4 lines.",
  "hookLine": "a short, punchy call-to-action line for the bottom of a shareable card, like 'tag someone who'd choke on round 1' - playful, dares a friend to try. Hard limit: 8 words or fewer."
}`,
      },
      {
        role: "user",
        content: `Player name: ${name}\nTheir prompt -> answer pairs from this round:\n${transcript}\n\nWrite the verdict and hook line.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as { verdict?: string; hookLine?: string };

  return NextResponse.json({
    verdict: parsed.verdict ?? "Your brain, unfiltered, on opening night.",
    hookLine: parsed.hookLine ?? "tag someone who'd choke on round 1",
  });
}
