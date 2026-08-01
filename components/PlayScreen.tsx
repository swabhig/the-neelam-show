"use client";

import { useEffect, useRef, useState } from "react";
import { getNextRoundPrompts } from "@/lib/prompts";
import { speak, cancelSpeech } from "@/lib/tts";
import { createVAD } from "@/lib/vad";
import { AnswerRecorder } from "@/lib/recorder";

const ROUND_SECONDS_DEFAULT = 60;
const HESITATION_SKIP_MS = 3000;
const HEARD_YOU_FLASH_MS = 250;
// Real phones' speechSynthesis "finished talking" event is unreliable -
// it can fire early, well before the audio has actually finished
// playing. This floor guarantees a minimum wait based on word length,
// so the player's turn never starts before the host has plausibly
// finished saying the word, regardless of whether that event misfires.
const MIN_MS_PER_CHAR = 90;
const MIN_SPEAK_FLOOR_MS = 700;

type Answer = { prompt: string; text: string };
type Phase = "hostSpeaking" | "listening" | "hearing" | "heardYou";

async function speakWithFloor(text: string, language: "english" | "hinglish") {
  const floor = Math.max(MIN_SPEAK_FLOOR_MS, text.length * MIN_MS_PER_CHAR);
  await Promise.all([
    speak(text, language),
    new Promise((resolve) => setTimeout(resolve, floor)),
  ]);
}

export function PlayScreen({
  name,
  language,
  recentWords,
  onRoundEnd,
  roundSeconds = ROUND_SECONDS_DEFAULT,
}: {
  name: string;
  language: "english" | "hinglish";
  recentWords: string[];
  onRoundEnd: (result: { count: number; answers: Answer[] }) => void;
  /** Override for testing - defaults to the real 60s round. */
  roundSeconds?: number;
}) {
  const [count, setCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(roundSeconds);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("hostSpeaking");
  const endRoundRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    let vad: { stop: () => void } | null = null;
    let timerInterval: ReturnType<typeof setInterval> | null = null;
    let hesitationTimer: ReturnType<typeof setTimeout> | null = null;
    let heardYouTimer: ReturnType<typeof setTimeout> | null = null;
    let roundEnded = false;

    // All game state lives as plain closure variables, not refs - every
    // reader and writer below (the timer, the VAD callbacks, endRound)
    // is defined inside this same effect, so a shared closure is enough.
    let liveCount = 0;
    let prompts: string[] = [];
    let promptIndex = -1;
    let currentPromptWord = "";
    const answers: Answer[] = [];

    async function setup() {
      prompts = getNextRoundPrompts(recentWords, 40);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (cancelled) return;

      const recorder = new AnswerRecorder(stream);

      // Guards against the mic picking up the host's own voice (phone
      // speaker bleeding into the phone mic) and mistaking it for an
      // answer - only true while we actually want the player's turn.
      let acceptingAnswer = false;

      function armHesitationSkip() {
        if (hesitationTimer) clearTimeout(hesitationTimer);
        hesitationTimer = setTimeout(() => {
          nextPrompt();
        }, HESITATION_SKIP_MS);
      }

      async function nextPrompt() {
        acceptingAnswer = false;
        promptIndex += 1;
        if (promptIndex >= prompts.length) {
          prompts = [...prompts, ...getNextRoundPrompts(recentWords, 20)];
        }
        const next = prompts[promptIndex];
        currentPromptWord = next;
        setCurrentPrompt(next);
        setPhase("hostSpeaking");
        await speakWithFloor(next, language);
        if (cancelled || roundEnded) return;
        // The player's turn - and the hesitation countdown - only starts
        // once the host has actually finished saying the word (or the
        // minimum floor has passed), not the instant we told it to speak.
        acceptingAnswer = true;
        setPhase("listening");
        armHesitationSkip();
      }

      function onSpeechStart() {
        if (!acceptingAnswer) return;
        if (hesitationTimer) clearTimeout(hesitationTimer);
        setPhase("hearing");
        recorder.start();
      }

      function onSpeechEnd() {
        if (!acceptingAnswer) return;
        acceptingAnswer = false;

        // Advance the score IMMEDIATELY - nothing below this line before
        // the counter update touches the network.
        const finishedPrompt = currentPromptWord;
        liveCount += 1;
        setCount(liveCount);
        setPhase("heardYou");

        recorder
          .stop()
          .then((blob) => {
            // Fire-and-forget: the game has already moved to the next
            // prompt by the time this resolves.
            const formData = new FormData();
            formData.append("audio", blob);
            return fetch("/api/transcribe", { method: "POST", body: formData });
          })
          .then((res) => res.json())
          .then((data: { text: string }) => {
            answers.push({ prompt: finishedPrompt, text: data.text });
          })
          .catch(() => {
            answers.push({ prompt: finishedPrompt, text: "(missed that one)" });
          });

        // Brief confirming flash before moving on - the score already
        // updated above, this delay only affects the visual transition.
        if (heardYouTimer) clearTimeout(heardYouTimer);
        heardYouTimer = setTimeout(() => {
          if (!cancelled && !roundEnded) nextPrompt();
        }, HEARD_YOU_FLASH_MS);
      }

      vad = createVAD(stream, onSpeechStart, onSpeechEnd);

      function endRound() {
        if (roundEnded) return;
        roundEnded = true;
        if (timerInterval) clearInterval(timerInterval);
        if (hesitationTimer) clearTimeout(hesitationTimer);
        if (heardYouTimer) clearTimeout(heardYouTimer);
        vad?.stop();
        cancelSpeech();

        // Give in-flight background transcriptions a moment to land -
        // this is the reveal screen's natural "revealing..." pause.
        setTimeout(() => {
          if (!cancelled) onRoundEnd({ count: liveCount, answers });
        }, 800);
      }

      endRoundRef.current = endRound;

      await speakWithFloor(`Ready, ${name}?`, language);
      if (cancelled) return;
      await nextPrompt();

      let remaining = roundSeconds;
      timerInterval = setInterval(() => {
        remaining -= 1;
        setSecondsLeft(remaining);
        if (remaining === 30 || remaining === 10) {
          speak(`${remaining} seconds left`, language);
        }
        if (remaining <= 0) {
          endRound();
        }
      }, 1000);
    }

    setup();

    return () => {
      cancelled = true;
      if (timerInterval) clearInterval(timerInterval);
      if (hesitationTimer) clearTimeout(hesitationTimer);
      if (heardYouTimer) clearTimeout(heardYouTimer);
      vad?.stop();
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phaseLabel: Record<Phase, string> = {
    hostSpeaking: "host is talking…",
    listening: "your turn — say the first thing that comes to mind",
    hearing: "hearing you…",
    heardYou: "got it!",
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <button
        onClick={() => endRoundRef.current()}
        className="absolute right-5 top-5 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide"
        style={{ borderColor: "oklch(0.4 0.02 40)", color: "oklch(0.65 0.02 60)" }}
      >
        End Round
      </button>

      <div className="bebas leading-none" style={{ color: "var(--accent)", fontSize: "clamp(4rem, 22vw, 8rem)" }}>
        {secondsLeft}s
      </div>
      <div className="bebas text-5xl">{count}</div>
      <div className="bebas text-4xl">{currentPrompt}</div>

      <div className="flex flex-col items-center gap-3">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-150"
          style={{
            borderColor:
              phase === "hearing" || phase === "heardYou"
                ? "var(--accent)"
                : "oklch(0.4 0.02 40)",
            background:
              phase === "hearing"
                ? "var(--accent-glow)"
                : phase === "heardYou"
                  ? "var(--accent)"
                  : "transparent",
            transform: phase === "hearing" ? "scale(1.15)" : "scale(1)",
            boxShadow:
              phase === "hearing" ? "0 0 24px var(--accent-glow)" : "none",
          }}
        >
          <span className="text-2xl">
            {phase === "hostSpeaking" ? "\u{1F399}️" : "\u{1F3A4}"}
          </span>
        </div>
        <p
          className="text-sm"
          style={{
            color:
              phase === "hearing" || phase === "heardYou"
                ? "var(--accent)"
                : "oklch(0.65 0.02 60)",
          }}
        >
          {phaseLabel[phase]}
        </p>
      </div>
    </div>
  );
}
