import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Answer = { prompt: string; text: string };
type Highlight = Answer & { note: string };

export async function POST(req: NextRequest) {
  const { name, answers } = (await req.json()) as {
    name: string;
    answers: Answer[];
  };

  const transcript = answers
    .map((a, i) => `${i}: ${a.prompt} -> ${a.text}`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 1.0,
    messages: [
      {
        role: "system",
        content: `You are the witty voiceover artist for a Bollywood-flavored rapid-fire word-association party game called THE NEELAM SHOW. Players hear a word and blurt the first thing that comes to mind, 60 seconds, back to back.

Your job after each round: read their list of prompt->answer pairs like a dramatic Bollywood film critic reviewing someone's brain as if it were a movie. Be genuinely funny, a little dramatic, a little cheeky - think movie-poster tagline energy, not a generic compliment. Reference their SPECIFIC answers, don't write generic filler that could apply to anyone.

Return strict JSON only, matching this shape exactly:
{
  "verdict": "a punchy 1-2 line 'movie review' of their brain, can include a star rating like ★★★★☆ for comic effect",
  "caption": "a short, separate, shareable one-liner for social media - filmy, dramatic, uses 1-2 of their actual answers",
  "highlightIndexes": [array of up to 5 numbers - the indexes (from the numbered list) of the most interesting/funniest/most surprising answers worth showing off, picked from the actual list given, best ones first],
  "highlightNotes": [array of short witty one-line asides, same length and order as highlightIndexes, one clever comment per chosen answer - like a director's commentary on that specific reaction]
}`,
      },
      {
        role: "user",
        content: `Player name: ${name}\nTheir prompt -> answer pairs from this round (numbered):\n${transcript}\n\nWrite the review and pick the standout answers.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as {
    verdict?: string;
    caption?: string;
    highlightIndexes?: number[];
    highlightNotes?: string[];
  };

  const indexes = parsed.highlightIndexes ?? [];
  const notes = parsed.highlightNotes ?? [];
  const highlights: Highlight[] = indexes
    .map((idx, i) => {
      const answer = answers[idx];
      if (!answer) return null;
      return { ...answer, note: notes[i] ?? "" };
    })
    .filter((h): h is Highlight => h !== null)
    .slice(0, 5);

  return NextResponse.json({
    verdict: parsed.verdict ?? "Your brain works in mysterious ways.",
    caption: parsed.caption ?? "One word. Zero thinking time.",
    highlights: highlights.length > 0 ? highlights : answers.slice(0, 5).map((a) => ({ ...a, note: "" })),
  });
}
