import { NextRequest, NextResponse } from "next/server";

const VOICE_ID = "Zjz30d9v1e5xCxNVTni6";
const MODEL_ID = "eleven_multilingual_v2";

export async function POST(req: NextRequest) {
  const { text } = (await req.json()) as { text: string };

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
    return NextResponse.json(
      { error: await res.text() },
      { status: res.status }
    );
  }

  return new NextResponse(res.body, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
