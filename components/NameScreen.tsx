"use client";

import { useEffect, useState } from "react";
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
  { a: "Chai", b: "Sutta", bg: "var(--pink)" },
  { a: "Shaadi", b: "Bhaagna", bg: "var(--orange)" },
  { a: "Ex", b: "Delete", bg: "var(--blue)" },
];

export function NameScreen({
  onStart,
}: {
  onStart: (name: string, mode: "solo" | "pass") => void;
}) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"solo" | "pass">("solo");
  const [isIOS, setIsIOS] = useState(false);
  const getOrCreate = useMutation(api.players.getOrCreate);

  useEffect(() => {
    // navigator is unavailable during server-side prerendering, so this
    // has to be a client-only effect, not a lazy useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIOS(/iPhone|iPad|iPod/.test(navigator.userAgent));
  }, []);

  async function handleStart() {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Pass & play is a shared-device session between two people, so it
    // never touches Convex - saving a score there would overwrite
    // whichever one person's personal-best is meant to live on this
    // device with the other player's number.
    if (mode === "solo") {
      await getOrCreate({ deviceId: getDeviceId(), name: trimmed });
    }
    onStart(trimmed, mode);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden">
      <div
        className="pointer-events-none absolute rounded-full"
        style={{ top: -120, left: -120, width: 300, height: 300, background: "var(--orange)", opacity: 0.5, filter: "blur(2px)" }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{ top: -80, right: -100, width: 260, height: 260, background: "var(--pink)", opacity: 0.35 }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{ bottom: -100, left: -60, width: 240, height: 240, background: "var(--blue)", opacity: 0.25 }}
      />
      <div className="halftone pointer-events-none absolute inset-0" />

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
            style={{ color: "var(--muted)", fontWeight: 600 }}
          >
            Round 1 &middot; {mode === "solo" ? "Solo" : "Pass & Play"}
          </span>
        </div>

        {isIOS && (
          <div
            className="fade-in-up relative max-w-sm rounded-2xl px-4 py-3 text-center text-xs font-semibold"
            style={{
              background: "var(--card)",
              border: "2px solid var(--ink)",
              color: "var(--muted)",
              animationDelay: "40ms",
            }}
          >
            Known issue on iPhone: voice capture may not register your
            answers yet. A fix is in progress - sorry about that.
          </div>
        )}

        <div className="relative flex w-full flex-col items-center overflow-hidden py-8 text-center">
          <div
            className="pointer-events-none absolute rounded-full"
            style={{
              top: -20,
              width: 460,
              maxWidth: "100vw",
              height: 460,
              background:
                "repeating-conic-gradient(from 0deg, var(--orange) 0deg 8deg, transparent 8deg 20deg)",
              opacity: 0.18,
              animation: "spin 60s linear infinite",
            }}
          />
          <DialogueBlock lines={HEADER_DIALOGUE_LINES} rotate={-4} />

          <svg width="52" height="30" viewBox="0 0 46 34" className="relative mb-3.5">
            <rect x="1" y="9" width="44" height="24" rx="2" fill="none" stroke="var(--accent)" strokeWidth="1.6" />
            <rect x="1" y="1" width="44" height="8" rx="1.5" fill="var(--accent)" />
            <path d="M4 1 L10 9 M13 1 L19 9 M22 1 L28 9 M31 1 L37 9 M40 1 L44 8" stroke="var(--bg)" strokeWidth="2" />
          </svg>

          <h1
            className="fade-in-up display relative text-6xl leading-none sm:text-7xl"
            style={{ animationDelay: "100ms", textShadow: "3px 3px 0 var(--orange)" }}
          >
            THE NEELAM
            <br />
            SHOW
          </h1>
          <p
            className="fade-in-up relative mt-4.5 text-sm font-bold uppercase tracking-wide"
            style={{ color: "var(--accent)", animationDelay: "220ms" }}
          >
            a party game for people who talk before they think
          </p>
          <p
            className="fade-in-up relative mt-4 max-w-xs text-lg"
            style={{ color: "var(--body-text)", animationDelay: "320ms" }}
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
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: pair.bg, color: "var(--card)" }}
            >
              {pair.a} <span style={{ opacity: 0.8 }}>&rarr;</span> {pair.b}
            </div>
          ))}
        </div>

        <div
          className="fade-in-up flex w-full max-w-sm flex-col gap-4 rounded-[22px] p-7"
          style={{
            background: "var(--card)",
            border: "2px solid var(--ink)",
            boxShadow: "6px 6px 0 var(--ink)",
            animationDelay: "480ms",
          }}
        >
          <label className="flex flex-col gap-1.5 text-left">
            <span
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--muted)" }}
            >
              Your Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya"
              className="rounded-xl px-4 py-3 text-base"
              style={{
                background: "#fff",
                border: "2px solid var(--ink)",
                color: "var(--ink)",
              }}
            />
          </label>

          <div className="flex gap-2">
            {(["solo", "pass"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="lang-btn flex-1 rounded-full py-2.5 text-sm font-bold"
                style={{
                  border: "2px solid var(--ink)",
                  background: mode === m ? "var(--pink)" : "transparent",
                  color: "var(--ink)",
                }}
              >
                {m === "solo" ? "Solo" : "Play with a friend"}
              </button>
            ))}
          </div>

          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="poster-action-btn mt-1 rounded-full py-4 text-lg font-extrabold disabled:opacity-40"
            style={{
              background: "var(--accent)",
              color: "var(--card)",
              border: "2px solid var(--ink)",
              boxShadow: "4px 4px 0 var(--ink)",
            }}
          >
            Start &rarr;
          </button>
        </div>

        <div className="relative mt-14 flex w-full flex-col items-center gap-3 overflow-hidden py-10 text-center">
          <DialogueBlock lines={FOOTER_DIALOGUE_LINES} rotate={3} fontSize={22} />
          <span
            className="relative text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            why this game
          </span>
          <p
            className="relative max-w-sm text-sm"
            style={{ color: "var(--body-text)" }}
          >
            Inspired by the rapid-fire word-association scene from a
            beloved 90s Bollywood movie moment - rebuilt as an instant,
            voice-powered party game.
          </p>
          <p className="relative text-xs" style={{ color: "var(--muted-soft)" }}>
            Not affiliated with, endorsed by, or representing the
            original film, show, or cast.
          </p>
        </div>
      </div>

      <FilmSprocket />
    </div>
  );
}
