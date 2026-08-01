import { PROMPT_BANK } from "./prompts";
import { slugify } from "./audioSlug";
import { FIXED_PHRASES } from "./ttsPhrases";

// Every text that got pre-generated as a static clip by
// scripts/generate-tts.ts - anything not in this set falls back to a
// live ElevenLabs call instead.
const KNOWN_TEXTS = new Set<string>([
  ...Object.values(PROMPT_BANK).flat(),
  ...FIXED_PHRASES,
]);

let currentAudio: HTMLAudioElement | null = null;

function playUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

// Some browsers (seen on iOS Safari) can leave an <audio> element neither
// firing 'ended'/'error' nor rejecting play() - it just silently never
// finishes. Since speakWithFloor() awaits the "Ready, {name}?" greeting
// before the round starts, a stuck promise here would block the whole
// game from ever beginning. This guarantees speak() always settles.
function withTimeout(promise: Promise<void>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    promise.then(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

export function speak(text: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const normalized = text.toLowerCase().trim();
  if (KNOWN_TEXTS.has(normalized)) {
    return withTimeout(playUrl(`/audio/${slugify(text)}.mp3`), 4000);
  }

  // Dynamic text (the "Ready, {name}?" greeting) isn't pregenerated, so
  // this goes to ElevenLabs live - acceptable here since it only happens
  // once before the round's tight cadence begins, not mid-round.
  return withTimeout(
    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
      .then((res) => res.blob())
      .then((blob) => playUrl(URL.createObjectURL(blob)))
      .catch(() => {}),
    6000
  );
}

export function cancelSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
