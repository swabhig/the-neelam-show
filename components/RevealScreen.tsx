"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  FilmSprocket,
  DialogueBlock,
  FOOTER_DIALOGUE_LINES,
} from "./FilmDecor";

type Answer = { prompt: string; text: string };
type Highlight = Answer & { note: string };

function downloadCsv(name: string, answers: Answer[]) {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = [
    "Prompt,Answer",
    ...answers.map((a) => `${escape(a.prompt)},${escape(a.text)}`),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `the-neelam-show-${name.toLowerCase().replace(/\s+/g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function RevealScreen({
  name,
  deviceId,
  count,
  answers,
  onPlayAgain,
}: {
  name: string;
  deviceId: string;
  count: number;
  answers: Answer[];
  onPlayAgain: () => void;
}) {
  const [verdict, setVerdict] = useState("");
  const [caption, setCaption] = useState("");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [displayCount, setDisplayCount] = useState(0);
  const updateAfterRound = useMutation(api.players.updateAfterRound);

  useEffect(() => {
    updateAfterRound({
      deviceId,
      score: count,
      wordsUsed: answers.map((a) => a.prompt),
    });

    fetch("/api/verdict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, answers }),
    })
      .then((res) => res.json())
      .then((data: { verdict: string; caption: string; highlights: Highlight[] }) => {
        setVerdict(data.verdict);
        setCaption(data.caption);
        setHighlights(data.highlights);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Dramatic count-up reveal instead of the number just appearing.
    let current = 0;
    const step = Math.max(1, Math.round(count / 20));
    const interval = setInterval(() => {
      current = Math.min(count, current + step);
      setDisplayCount(current);
      if (current >= count) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [count]);

  const shareText = caption
    ? `${caption} I answered ${count} in 60 seconds on THE NEELAM SHOW \u{1F440}`
    : `I answered ${count} in 60 seconds on THE NEELAM SHOW \u{1F440}`;

  return (
    <div className="flex min-h-screen flex-col items-center">
      <FilmSprocket />

      <div className="flex w-full max-w-[560px] flex-1 flex-col items-center px-6 py-10">
        <p className="bebas text-xl" style={{ color: "var(--accent)" }}>
          {name} answered
        </p>

        <div className="relative flex flex-col items-center py-4">
          <div
            className="absolute rounded-full"
            style={{
              top: -40,
              width: 320,
              height: 320,
              background:
                "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
              animation: "glowPulse 4s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
          <div className="bebas relative text-9xl">{displayCount}</div>
        </div>
        <p className="text-lg" style={{ color: "oklch(0.9 0.01 75)" }}>
          in 60 seconds
        </p>

        <div
          className="mt-6 min-h-[3.5rem] max-w-sm px-2 text-center text-lg italic transition-opacity duration-500"
          style={{
            color: "var(--accent)",
            opacity: verdict ? 1 : 0,
          }}
        >
          {verdict || "revealing the verdict…"}
        </div>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          {highlights.map((h, i) => (
            <div
              key={i}
              className="flex overflow-hidden rounded-2xl border"
              style={{
                borderColor: "var(--accent)",
                background:
                  "linear-gradient(180deg, oklch(0.2 0.03 40) 0%, oklch(0.13 0.02 40) 100%)",
              }}
            >
              <div className="flex flex-1 flex-col gap-1 p-4">
                <div className="flex items-baseline justify-between">
                  <span
                    className="text-xs uppercase tracking-wide"
                    style={{ color: "var(--accent)" }}
                  >
                    {h.prompt}
                  </span>
                  <span className="bebas text-lg">{h.text}</span>
                </div>
                {h.note && (
                  <p className="text-xs" style={{ color: "oklch(0.75 0.01 75)" }}>
                    {h.note}
                  </p>
                )}
              </div>
              <div
                style={{
                  width: 0,
                  borderLeft: "2px dashed oklch(0.4 0.02 40)",
                }}
              />
              <div
                className="flex w-8 items-center justify-center"
                style={{ background: "oklch(0.16 0.025 40)" }}
              >
                <span
                  className="bebas text-xs"
                  style={{
                    writingMode: "vertical-rl",
                    letterSpacing: "0.15em",
                    color: "var(--accent)",
                  }}
                >
                  TAKE {i + 1}
                </span>
              </div>
            </div>
          ))}
        </div>

        {answers.length > highlights.length && (
          <button
            onClick={() => downloadCsv(name, answers)}
            className="mt-4 text-sm underline"
            style={{ color: "oklch(0.65 0.02 60)" }}
          >
            Download all {answers.length} answers (CSV)
          </button>
        )}

        <div className="mt-8 flex w-full max-w-sm gap-3">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-full border py-3 text-center text-sm font-semibold"
            style={{ borderColor: "oklch(0.4 0.02 40)" }}
          >
            Share on X
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-full border py-3 text-center text-sm font-semibold"
            style={{ borderColor: "oklch(0.4 0.02 40)" }}
          >
            Share on WhatsApp
          </a>
        </div>

        <button
          onClick={onPlayAgain}
          className="mt-4 rounded-full px-10 py-4 text-lg font-bold"
          style={{ background: "var(--accent)", color: "oklch(0.15 0.02 40)" }}
        >
          Play Again
        </button>

        <div className="relative mt-14 flex w-full flex-col items-center overflow-hidden py-8 text-center">
          <DialogueBlock lines={FOOTER_DIALOGUE_LINES} rotate={3} fontSize={20} />
        </div>
      </div>

      <FilmSprocket />
    </div>
  );
}
