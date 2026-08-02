import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Answer = { prompt: string; text: string };
type Opponent = { name: string; answers: Answer[] };

const SOLO_SYSTEM_PROMPT = `You are the witty voiceover artist for a Bollywood-flavored rapid-fire word-association party game called THE NEELAM SHOW. Players hear a word and blurt the first thing that comes to mind, back to back for 60 seconds.

Your job after each round: read their list of prompt->answer pairs like a dramatic Bollywood film critic reviewing someone's brain as if it were a movie. Be genuinely funny, a little dramatic, a little cheeky - think movie-poster tagline energy, not a generic compliment. Reference their SPECIFIC answers, don't write generic filler that could apply to anyone.

Return strict JSON only, matching this shape exactly:
{
  "verdict": "ONE short, elegant, dramatic sentence in an italic movie-tagline voice - reads like a poster quote, references 1-2 of their specific answers. Hard limit: 16 words or fewer, this sits on a small card and cannot wrap more than 3-4 lines.",
  "hookLine": "a short, punchy call-to-action line for the bottom of a shareable card, like 'tag someone who'd choke on round 1' - playful, dares a friend to try. Hard limit: 8 words or fewer."
}`;

const VS_SYSTEM_PROMPT = `You are the witty voiceover artist for a Bollywood-flavored rapid-fire word-association party game called THE NEELAM SHOW. Two players each heard the same kind of words and blurted the first thing that came to mind, back to back for 60 seconds, racing each other remotely.

Your job: read BOTH players' prompt->answer pairs like a dramatic Bollywood film critic reviewing a head-to-head rivalry. Be genuinely funny, a little dramatic, a little cheeky - think movie-poster tagline for a rivalry film. You MUST directly compare their specific answers against each other by name, not just describe one person - the whole point is the contrast between them.

Return strict JSON only, matching this shape exactly:
{
  "verdict": "ONE short, elegant, dramatic sentence in an italic movie-tagline voice that directly compares both players by name, referencing at least one specific answer from each. Hard limit: 20 words or fewer, this sits on a small card and cannot wrap more than 3-4 lines.",
  "hookLine": "a short, punchy call-to-action line for the bottom of a shareable card, like 'rematch demanded' - playful, dares them to play again. Hard limit: 8 words or fewer."
}`;

export async function POST(req: NextRequest) {
  const { name, answers, opponent } = (await req.json()) as {
    name: string;
    answers: Answer[];
    opponent?: Opponent;
  };

  const transcript = answers.map((a) => `${a.prompt} -> ${a.text}`).join("\n");

  const userContent = opponent
    ? `Player 1: ${name}\nTheir prompt -> answer pairs:\n${transcript}\n\nPlayer 2: ${opponent.name}\nTheir prompt -> answer pairs:\n${opponent.answers.map((a) => `${a.prompt} -> ${a.text}`).join("\n")}\n\nWrite the head-to-head verdict and hook line, comparing them directly.`
    : `Player name: ${name}\nTheir prompt -> answer pairs from this round:\n${transcript}\n\nWrite the verdict and hook line.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 1.0,
    messages: [
      {
        role: "system",
        content: opponent ? VS_SYSTEM_PROMPT : SOLO_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userContent,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as { verdict?: string; hookLine?: string };

  return NextResponse.json({
    verdict:
      parsed.verdict ??
      (opponent
        ? "Two brains, zero filters, one winner."
        : "Your brain, unfiltered, on opening night."),
    hookLine: parsed.hookLine ?? "tag someone who'd choke on round 1",
  });
}
