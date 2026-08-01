"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getDeviceId } from "@/lib/deviceId";
import {
  FilmSprocket,
  DialogueBlock,
  ScatteredDialogue,
  HEADER_DIALOGUE_LINES,
  FOOTER_DIALOGUE_LINES,
} from "./FilmDecor";

const EXAMPLE_PAIRS = [
  { a: "Chai", b: "Sutta" },
  { a: "Shaadi", b: "Bhaagna" },
  { a: "Ex", b: "Delete" },
];

export function NameScreen({
  onStart,
}: {
  onStart: (name: string, language: "english" | "hinglish") => void;
}) {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<"english" | "hinglish">(
    "english"
  );
  const getOrCreate = useMutation(api.players.getOrCreate);

  async function handleStart() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await getOrCreate({ deviceId: getDeviceId(), name: trimmed });
    onStart(trimmed, language);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden">
      <ScatteredDialogue />
      <FilmSprocket />

      <div className="relative z-10 flex w-full max-w-[560px] flex-1 flex-col items-center px-6">
        <div
          className="fade-in-up flex items-center gap-2 py-6"
          style={{ animationDelay: "0ms" }}
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{
              background: "var(--accent)",
              animation: "badgePulse 2s ease-in-out infinite",
            }}
          />
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: "oklch(0.7 0.02 60)" }}
          >
            Round 1 &middot; Solo
          </span>
        </div>

        <div className="relative flex w-full flex-col items-center overflow-hidden py-8 text-center">
          <div
            className="absolute rounded-full"
            style={{
              top: -60,
              width: 420,
              maxWidth: "90vw",
              height: 420,
              background:
                "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
              animation: "glowPulse 4s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
          <DialogueBlock lines={HEADER_DIALOGUE_LINES} rotate={-4} />

          <h1
            className="fade-in-up bebas relative text-6xl leading-none sm:text-7xl"
            style={{ animationDelay: "100ms" }}
          >
            THE NEELAM
            <br />
            SHOW
          </h1>
          <p
            className="fade-in-up relative mt-4 text-sm uppercase tracking-wide"
            style={{ color: "var(--accent)", animationDelay: "220ms" }}
          >
            a party game for people who talk before they think
          </p>
          <p
            className="fade-in-up relative mt-5 max-w-xs text-lg"
            style={{ color: "oklch(0.9 0.01 75)", animationDelay: "320ms" }}
          >
            One word. Zero thinking time. What should we call you?
          </p>
        </div>

        <div
          className="fade-in-up flex flex-wrap justify-center gap-2 pb-2"
          style={{ animationDelay: "400ms" }}
        >
          {EXAMPLE_PAIRS.map((pair) => (
            <div
              key={pair.a}
              className="rounded-full border px-4 py-2 text-sm"
              style={{
                background: "oklch(0.2 0.03 40)",
                borderColor: "oklch(0.32 0.02 40)",
                color: "oklch(0.88 0.01 75)",
              }}
            >
              {pair.a} <span style={{ color: "var(--accent)" }}>&rarr;</span>{" "}
              {pair.b}
            </div>
          ))}
        </div>

        <div
          className="fade-in-up flex w-full max-w-sm flex-col gap-4 rounded-2xl border p-7"
          style={{
            background: "oklch(0.19 0.028 40)",
            borderColor: "oklch(0.3 0.02 40)",
            animationDelay: "480ms",
          }}
        >
          <label className="flex flex-col gap-1.5 text-left">
            <span
              className="text-xs uppercase tracking-wide"
              style={{ color: "oklch(0.65 0.02 60)" }}
            >
              Your Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya"
              className="rounded-lg border px-4 py-3 text-base"
              style={{
                background: "oklch(0.14 0.02 40)",
                borderColor: "oklch(0.35 0.02 40)",
                color: "var(--ink)",
              }}
            />
          </label>

          <div className="flex gap-2">
            {(["english", "hinglish"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className="flex-1 rounded-full border px-4 py-2 text-sm font-semibold"
                style={{
                  borderColor: "var(--accent)",
                  background:
                    language === lang ? "var(--accent)" : "transparent",
                  color:
                    language === lang
                      ? "oklch(0.15 0.02 40)"
                      : "var(--ink)",
                }}
              >
                {lang === "english" ? "English" : "Hindi + English"}
              </button>
            ))}
          </div>

          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="mt-1 rounded-full py-4 text-lg font-bold disabled:opacity-40"
            style={{ background: "var(--accent)", color: "oklch(0.15 0.02 40)" }}
          >
            Start &rarr;
          </button>
        </div>

        <div className="relative mt-14 flex w-full flex-col items-center gap-3 overflow-hidden py-10 text-center">
          <DialogueBlock lines={FOOTER_DIALOGUE_LINES} rotate={3} fontSize={22} />
          <span
            className="relative text-xs uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            why this game
          </span>
          <p
            className="relative max-w-sm text-sm"
            style={{ color: "oklch(0.75 0.01 75)" }}
          >
            Inspired by the rapid-fire word-association scene from a
            beloved 90s Bollywood movie moment - rebuilt as an instant,
            voice-powered party game.
          </p>
          <p className="relative text-xs" style={{ color: "oklch(0.5 0.02 60)" }}>
            Not affiliated with, endorsed by, or representing the
            original film, show, or cast.
          </p>
        </div>
      </div>

      <FilmSprocket />
    </div>
  );
}
