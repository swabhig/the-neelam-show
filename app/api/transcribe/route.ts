import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "missing audio" }, { status: 400 });
  }

  const file = new File([audio], "answer.webm", {
    type: audio.type || "audio/webm",
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });

  return NextResponse.json({ text: transcription.text });
}
