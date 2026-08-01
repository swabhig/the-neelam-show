"use client";

import { useEffect, useRef, useState } from "react";
import { getNextRoundPrompts } from "@/lib/prompts";
import { speak, cancelSpeech } from "@/lib/tts";
import { createVAD } from "@/lib/vad";
import { AnswerRecorder } from "@/lib/recorder";

const ROUND_SECONDS_DEFAULT = 60;
const HESITATION_SKIP_MS = 3000;

type Answer = { prompt: string; text: string };

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

  useEffect(() => {
    let cancelled = false;
    let vad: { stop: () => void } | null = null;
    let timerInterval: ReturnType<typeof setInterval> | null = null;
    let hesitationTimer: ReturnType<typeof setTimeout> | null = null;
    let roundEnded = false;

    // All game state lives as plain closure variables, not refs - every
    // reader and writer below (the timer, the VAD callbacks, endRound)
    // is defined inside this same effect, so a shared closure is enough.
    let liveCount = 0;
    let prompts: string[] = [];
    let promptIndex = 0;
    let currentPromptWord = "";
    const answers: Answer[] = [];

    async function setup() {
      prompts = getNextRoundPrompts(recentWords, 40);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (cancelled) return;

      const recorder = new AnswerRecorder(stream);

      function armHesitationSkip() {
        if (hesitationTimer) clearTimeout(hesitationTimer);
        hesitationTimer = setTimeout(() => {
          nextPrompt();
        }, HESITATION_SKIP_MS);
      }

      function nextPrompt() {
        promptIndex += 1;
        if (promptIndex >= prompts.length) {
          prompts = [...prompts, ...getNextRoundPrompts(recentWords, 20)];
        }
        const next = prompts[promptIndex];
        currentPromptWord = next;
        setCurrentPrompt(next);
        speak(next, language);
        armHesitationSkip();
      }

      function onSpeechStart() {
        if (hesitationTimer) clearTimeout(hesitationTimer);
        recorder.start();
      }

      function onSpeechEnd() {
        // Advance the game IMMEDIATELY - nothing below this line before
        // nextPrompt() touches the network.
        const finishedPrompt = currentPromptWord;
        liveCount += 1;
        setCount(liveCount);

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

        nextPrompt();
      }

      vad = createVAD(stream, onSpeechStart, onSpeechEnd);

      function endRound() {
        if (roundEnded) return;
        roundEnded = true;
        if (timerInterval) clearInterval(timerInterval);
        if (hesitationTimer) clearTimeout(hesitationTimer);
        vad?.stop();
        cancelSpeech();

        // Give in-flight background transcriptions a moment to land -
        // this is the reveal screen's natural "revealing..." pause.
        setTimeout(() => {
          if (!cancelled) onRoundEnd({ count: liveCount, answers });
        }, 800);
      }

      // kick off the first prompt
      const first = prompts[0];
      currentPromptWord = first;
      setCurrentPrompt(first);
      await speak(`Ready, ${name}?`, language);
      if (cancelled) return;
      speak(first, language);
      armHesitationSkip();

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
      vad?.stop();
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="bebas text-2xl" style={{ color: "var(--accent)" }}>
        {secondsLeft}s
      </div>
      <div className="bebas text-7xl">{count}</div>
      <div className="bebas text-4xl">{currentPrompt}</div>
    </div>
  );
}
