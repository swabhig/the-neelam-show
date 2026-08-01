"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type Answer = { prompt: string; text: string };

const WATERMARK = "the-neelam-show.vercel.app";

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
  totalPrompts,
  answers,
  onPlayAgain,
}: {
  name: string;
  deviceId: string;
  count: number;
  totalPrompts: number;
  answers: Answer[];
  onPlayAgain: () => void;
}) {
  const [verdict, setVerdict] = useState(
    "Your brain, unfiltered, on opening night."
  );
  const [hookLine, setHookLine] = useState("tag someone who'd choke on round 1");
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
      .then((data: { verdict: string; hookLine: string }) => {
        setVerdict(data.verdict);
        setHookLine(data.hookLine);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareX =
    "https://twitter.com/intent/tweet?text=" +
    encodeURIComponent(
      `I scored ${count}/${totalPrompts} on The Neelam Show — one word, zero thinking time. Beat me if you can.`
    );
  const shareWhatsapp =
    "https://wa.me/?text=" +
    encodeURIComponent(
      `I scored ${count}/${totalPrompts} on The Neelam Show — one word, zero thinking time. Beat me if you can 👀`
    );

  return (
    <div
      className="relative flex min-h-screen flex-col items-center overflow-hidden px-5"
      style={{
        background: "oklch(0.1 0.015 40)",
        color: "oklch(0.96 0.015 75)",
        paddingTop: 56,
        paddingBottom: 64,
      }}
    >
      <div
        className="absolute rounded-full"
        style={{
          top: "10%",
          left: "50%",
          width: 600,
          height: 600,
          transform: "translateX(-50%)",
          background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <span
        className="relative mb-6 text-xs uppercase tracking-[0.25em]"
        style={{ color: "oklch(0.6 0.02 60)" }}
      >
        Screenshot this &middot; flex before it&apos;s cool
      </span>

      <div
        className="relative flex w-full flex-col overflow-hidden"
        style={{
          maxWidth: 440,
          aspectRatio: "4 / 5",
          border: "1px solid var(--accent)",
          borderRadius: 22,
          background:
            "linear-gradient(165deg, oklch(0.17 0.025 40) 0%, oklch(0.08 0.015 40) 100%)",
          boxShadow: "0 40px 90px oklch(0 0 0 / 0.55)",
          isolation: "isolate",
        }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ opacity: 0.5 }}>
          <span
            className="bebas absolute whitespace-nowrap"
            style={{
              top: "6%",
              left: "-4%",
              transform: "rotate(-12deg)",
              fontSize: 15,
              letterSpacing: "0.05em",
              color: "oklch(0.95 0.01 80)",
              opacity: 0.06,
            }}
          >
            कोई रिटेक नहीं होगा
          </span>
          <span
            className="bebas absolute whitespace-nowrap"
            style={{
              bottom: "10%",
              right: "-6%",
              transform: "rotate(9deg)",
              fontSize: 13,
              letterSpacing: "0.05em",
              color: "oklch(0.95 0.01 80)",
              opacity: 0.05,
            }}
          >
            SCENE ENDS &middot; ROLL CREDITS
          </span>
        </div>

        <div className="relative flex items-center justify-between px-6 pt-6">
          <span className="bebas text-lg" style={{ letterSpacing: "0.05em" }}>
            THE NEELAM SHOW
          </span>
          <span
            className="rounded-full border px-3 py-1 text-xs uppercase"
            style={{
              letterSpacing: "0.15em",
              color: "var(--accent)",
              borderColor: "var(--accent)",
            }}
          >
            Opening Night
          </span>
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center px-7 pb-2 pt-6">
          <div className="relative w-full" style={{ maxWidth: 290 }}>
            <div style={{ height: 30, overflow: "hidden", borderRadius: "6px 6px 0 0" }}>
              <div
                className="clapper-arm"
                style={{
                  height: 30,
                  width: "100%",
                  borderRadius: "6px 6px 0 0",
                  border: "1px solid var(--accent)",
                  background:
                    "repeating-linear-gradient(-35deg, var(--accent) 0 16px, oklch(0.08 0.015 40) 16px 32px)",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div
              className="relative flex flex-col items-center"
              style={{
                border: "1px solid var(--accent)",
                borderTop: "none",
                borderRadius: "0 0 10px 10px",
                background: "oklch(0.14 0.02 40 / 0.6)",
                padding: "30px 22px 26px",
              }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  borderRadius: "0 0 10px 10px",
                  background:
                    "radial-gradient(circle at 50% 20%, var(--accent-glow) 0%, transparent 70%)",
                  animation: "glowPulse 5s ease-in-out infinite",
                }}
              />
              <span
                className="bebas relative"
                style={{ fontSize: 96, lineHeight: 0.85, color: "oklch(0.99 0.005 85)" }}
              >
                {count}
                <span style={{ fontSize: 36, color: "oklch(0.55 0.02 60)" }}>
                  /{totalPrompts}
                </span>
              </span>
              <span
                className="relative mt-2.5 text-xs uppercase"
                style={{ letterSpacing: "0.15em", color: "oklch(0.6 0.02 60)" }}
              >
                correct in 60 seconds
              </span>
            </div>
          </div>

          <p
            className="mt-6 text-center italic"
            style={{
              fontFamily: "var(--font-cormorant-garamond), serif",
              fontSize: 23,
              lineHeight: 1.35,
              color: "var(--accent)",
              maxWidth: 320,
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {verdict}
          </p>
        </div>

        <div
          className="relative flex items-center justify-between gap-3.5 px-6 py-5"
          style={{ borderTop: "1px solid oklch(0.3 0.02 40 / 0.6)" }}
        >
          <span className="text-sm italic" style={{ color: "oklch(0.75 0.02 60)" }}>
            {hookLine}
          </span>
          <span
            className="whitespace-nowrap text-xs"
            style={{ letterSpacing: "0.06em", color: "oklch(0.6 0.02 60)" }}
          >
            {WATERMARK}
          </span>
        </div>
      </div>

      <div className="relative mt-8 flex w-full gap-3" style={{ maxWidth: 440 }}>
        <a
          href={shareX}
          target="_blank"
          rel="noreferrer"
          className="poster-action-btn poster-action-outline flex-1 rounded-full border py-3.5 text-center text-sm font-semibold"
          style={{ borderColor: "oklch(0.4 0.02 40)", color: "oklch(0.85 0.01 75)" }}
        >
          Share on X
        </a>
        <a
          href={shareWhatsapp}
          target="_blank"
          rel="noreferrer"
          className="poster-action-btn poster-action-outline flex-1 rounded-full border py-3.5 text-center text-sm font-semibold"
          style={{ borderColor: "oklch(0.4 0.02 40)", color: "oklch(0.85 0.01 75)" }}
        >
          Share on WhatsApp
        </a>
      </div>

      <button
        onClick={onPlayAgain}
        className="poster-action-btn poster-play-again relative mt-3.5 w-full rounded-full py-4.5 text-lg font-bold"
        style={{ maxWidth: 440, background: "var(--accent)", color: "oklch(0.15 0.02 40)" }}
      >
        Play Again
      </button>

      {answers.length > 0 && (
        <button
          onClick={() => downloadCsv(name, answers)}
          className="relative mt-4 text-sm underline"
          style={{ color: "oklch(0.55 0.02 60)" }}
        >
          Download all {answers.length} answers (CSV)
        </button>
      )}
    </div>
  );
}
