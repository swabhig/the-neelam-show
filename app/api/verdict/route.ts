import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { name, answers } = (await req.json()) as {
    name: string;
    answers: { prompt: string; text: string }[];
  };

  const transcript = answers
    .map((a) => `${a.prompt} -> ${a.text}`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You write short, punchy, Bollywood-flavored one-liners reacting to a player's rapid-fire word-association answers in a party game called The Neelam Show. Keep it playful, never mean. Return strict JSON only.",
      },
      {
        role: "user",
        content: `Player name: ${name}\nTheir prompt -> answer pairs from this round:\n${transcript}\n\nReturn JSON: {"verdict": "<one punchy line reading their 'brain type' from these answers>", "caption": "<a filmy, dramatic one-line caption for a shareable card, using 1-2 of their actual answers>"}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as { verdict?: string; caption?: string };

  return NextResponse.json({
    verdict: parsed.verdict ?? "Your brain works in mysterious ways.",
    caption: parsed.caption ?? "One word. Zero thinking time.",
  });
}
