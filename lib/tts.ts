function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    // Voices load asynchronously on first page load in most browsers.
    const handle = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handle);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", handle);
    // Fallback in case voiceschanged never fires on this browser.
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
  });
}

const voiceCache = new Map<string, SpeechSynthesisVoice | null>();

async function pickVoice(
  language: "english" | "hinglish"
): Promise<SpeechSynthesisVoice | null> {
  if (voiceCache.has(language)) return voiceCache.get(language)!;

  const voices = await getVoicesAsync();
  const preferredLangs =
    language === "hinglish"
      ? ["hi-IN", "hi", "en-IN"]
      : ["en-IN", "en-GB", "en-US", "en"];

  let chosen: SpeechSynthesisVoice | null = null;
  for (const lang of preferredLangs) {
    const match = voices.find((v) =>
      v.lang.toLowerCase().startsWith(lang.toLowerCase())
    );
    if (match) {
      chosen = match;
      break;
    }
  }

  voiceCache.set(language, chosen);
  return chosen;
}

export function speak(
  text: string,
  language: "english" | "hinglish" = "english"
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    pickVoice(language).then((voice) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "hinglish" ? "hi-IN" : "en-IN";
      if (voice) utterance.voice = voice;
      utterance.rate = 1.1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  });
}

export function cancelSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
