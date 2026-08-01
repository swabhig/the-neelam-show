"use client";

import { useEffect, useRef, useState } from "react";
import { getNextRoundPrompts } from "@/lib/prompts";
import { speak, cancelSpeech } from "@/lib/tts";
import { AnswerRecorder } from "@/lib/recorder";

const ROUND_SECONDS_DEFAULT = 60;
// Fixed cadence, independent of speech/mic detection entirely - this is
// what makes pacing reliable regardless of how a given phone's mic or
// speechSynthesis behaves. ~30 words max in a 60s round.
const WORD_CYCLE_MS = 2000;
// How long to let the host finish speaking before we start recording,
// so the recording captures the player's answer, not the host's own
// voice bleeding through the phone speaker into its own mic.
const MIN_MS_PER_CHAR = 90;
const MIN_SPEAK_FLOOR_MS = 500;

// Whisper's well-documented habit of hallucinating a stock phrase when
// given silence or pure noise - filtered out so ambient sound is never
// mistaken for a spoken answer.
const NOISE_PATTERNS = /^(thank you\.?|thanks for watching\.?|you\.?|bye\.?|\.+)$/i;

type Answer = { prompt: string; text: string };
type Phase = "hostSpeaking" | "listening";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function speakWithFloor(text: string, language: "english" | "hinglish") {
  cancelSpeech();
  const floor = Math.max(MIN_SPEAK_FLOOR_MS, text.length * MIN_MS_PER_CHAR);
  await Promise.all([speak(text, language), sleep(floor)]);
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
  onRoundEnd: (result: {
    count: number;
    totalPrompts: number;
    answers: Answer[];
  }) => void;
  /** Override for testing - defaults to the real 60s round. */
  roundSeconds?: number;
}) {
  const [count, setCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(roundSeconds);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("hostSpeaking");
  const [justScored, setJustScored] = useState(false);
  const endRoundRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    let timerInterval: ReturnType<typeof setInterval> | null = null;
    let roundEnded = false;
    let scoreFlashTimer: ReturnType<typeof setTimeout> | null = null;

    let liveCount = 0;
    let totalPrompts = 0;
    let prompts: string[] = [];
    let promptIndex = -1;
    const answers: Answer[] = [];

    async function setup() {
      prompts = getNextRoundPrompts(recentWords, 40);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (cancelled) return;

      const recorder = new AnswerRecorder(stream);

      function scoreIfRealAnswer(prompt: string, text: string) {
        const cleaned = text.trim();
        const isNoise = !cleaned || NOISE_PATTERNS.test(cleaned);
        if (isNoise) return;

        liveCount += 1;
        setCount(liveCount);
        answers.push({ prompt, text: cleaned });

        setJustScored(true);
        if (scoreFlashTimer) clearTimeout(scoreFlashTimer);
        scoreFlashTimer = setTimeout(() => setJustScored(false), 400);
      }

      async function runCycle() {
        if (cancelled || roundEnded) return;

        promptIndex += 1;
        if (promptIndex >= prompts.length) {
          prompts = [...prompts, ...getNextRoundPrompts(recentWords, 20)];
        }
        const word = prompts[promptIndex];
        totalPrompts += 1;
        setCurrentPrompt(word);
        setPhase("hostSpeaking");

        // Fire-and-forget: don't let TTS reliability affect the fixed
        // cadence at all, only use it to produce audio.
        speakWithFloor(word, language);

        const listenDelay = Math.max(
          400,
          Math.min(1200, word.length * MIN_MS_PER_CHAR)
        );
        await sleep(listenDelay);
        if (cancelled || roundEnded) return;

        setPhase("listening");
        recorder.start();

        await sleep(WORD_CYCLE_MS - listenDelay);
        if (cancelled || roundEnded) return;

        recorder
          .stop()
          .then((blob) => {
            const formData = new FormData();
            formData.append("audio", blob);
            return fetch("/api/transcribe", { method: "POST", body: formData });
          })
          .then((res) => res.json())
          .then((data: { text: string }) => {
            scoreIfRealAnswer(word, data.text ?? "");
          })
          .catch(() => {
            // transcription failure just means this window isn't scored -
            // never crash the round over a single failed request.
          });

        runCycle();
      }

      function endRound() {
        if (roundEnded) return;
        roundEnded = true;
        if (timerInterval) clearInterval(timerInterval);
        if (scoreFlashTimer) clearTimeout(scoreFlashTimer);
        cancelSpeech();

        // Give in-flight background transcriptions a moment to land -
        // this is the reveal screen's natural "revealing..." pause.
        setTimeout(() => {
          if (!cancelled) onRoundEnd({ count: liveCount, totalPrompts, answers });
        }, 800);
      }

      endRoundRef.current = endRound;

      await speakWithFloor(`Ready, ${name}?`, language);
      if (cancelled) return;
      runCycle();

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
      if (scoreFlashTimer) clearTimeout(scoreFlashTimer);
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
      <div
        className="pointer-events-none absolute rounded-full"
        style={{ top: -140, right: -140, width: 320, height: 320, background: "var(--pink)", opacity: 0.3 }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{ bottom: -160, left: -140, width: 320, height: 320, background: "var(--blue)", opacity: 0.25 }}
      />
      <div className="halftone pointer-events-none absolute inset-0" />

      <button
        onClick={() => endRoundRef.current()}
        className="end-btn absolute right-5 top-5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide"
        style={{ border: "2px solid var(--ink)", color: "var(--ink)" }}
      >
        End Round
      </button>

      <div className="relative flex items-center gap-4.5">
        <div
          className="flex flex-col items-center justify-center gap-1 rounded-[26px] px-10 py-6"
          style={{ background: "var(--ink)" }}
        >
          <div className="display leading-none" style={{ color: "var(--orange)", fontSize: "clamp(4.25rem, 20vw, 6.5rem)" }}>
            {secondsLeft}
          </div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--card-alt)" }}>
            seconds
          </span>
        </div>
        <div
          className="flex h-[86px] w-[86px] flex-col items-center justify-center gap-0.5 rounded-full transition-transform duration-150"
          style={{ background: "var(--pink)", boxShadow: "4px 4px 0 var(--ink)", transform: justScored ? "scale(1.25)" : "scale(1)" }}
        >
          <span className="display text-4xl leading-none" style={{ color: "var(--card)" }}>
            {count}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--card-alt)" }}>
            done
          </span>
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-2.5">
        <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
          say the first word
        </span>
        <div
          className="display text-5xl leading-none"
          style={{ color: "var(--accent)", textShadow: "3px 3px 0 var(--ink)" }}
        >
          {currentPrompt}
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-3">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-150"
          style={{
            borderColor: phase === "listening" ? "var(--accent)" : "var(--ink)",
            background: phase === "listening" ? "var(--accent-glow)" : "transparent",
            boxShadow: phase === "listening" ? "0 0 0 6px var(--accent-glow)" : "none",
          }}
        >
          <span className="text-2xl">
            {phase === "hostSpeaking" ? "\u{1F399}️" : "\u{1F3A4}"}
          </span>
        </div>
        <p
          className="text-sm font-semibold"
          style={{ color: phase === "listening" ? "var(--accent)" : "var(--muted)" }}
        >
          {phase === "hostSpeaking"
            ? "host is talking…"
            : "your turn — say the first thing that comes to mind"}
        </p>
      </div>
    </div>
  );
}
