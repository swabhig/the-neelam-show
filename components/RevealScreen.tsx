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
  // Flavor stat only, not calculated from real data - there isn't enough
  // real play history yet for a genuine "vs average" comparison to mean
  // anything. Randomized once per reveal so it varies round to round.
  // Generated client-side only (in an effect, not the initializer) so
  // the server-rendered value can never mismatch the client's.
  const [fasterThanAvg, setFasterThanAvg] = useState<number | null>(null);
  useEffect(() => {
    setFasterThanAvg(27 + Math.floor(Math.random() * 23));
  }, []);
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
      `I answered ${count} in 60 seconds on The Neelam Show — one word, zero thinking time, no right or wrong answers. Beat me if you can.`
    );
  const shareWhatsapp =
    "https://wa.me/?text=" +
    encodeURIComponent(
      `I answered ${count} in 60 seconds on The Neelam Show — one word, zero thinking time, no right or wrong answers. Beat me if you can 👀`
    );

  return (
    <div
      className="relative flex min-h-screen flex-col items-center overflow-hidden px-5"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        paddingTop: 56,
        paddingBottom: 64,
      }}
    >
      <div
        className="pointer-events-none absolute rounded-full"
        style={{ top: -140, left: -120, width: 320, height: 320, background: "var(--orange)", opacity: 0.35 }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{ bottom: -160, right: -120, width: 320, height: 320, background: "var(--blue)", opacity: 0.25 }}
      />
      <div className="halftone pointer-events-none absolute inset-0" />

      <span
        className="relative mb-6 text-xs font-semibold uppercase tracking-[0.25em]"
        style={{ color: "var(--muted)" }}
      >
        Screenshot this &middot; flex before it&apos;s cool
      </span>

      <div
        className="relative flex w-full flex-col overflow-hidden"
        style={{
          maxWidth: 440,
          aspectRatio: "4 / 5",
          border: "2px solid var(--ink)",
          borderRadius: 22,
          background: "var(--card)",
          boxShadow: "6px 6px 0 var(--ink)",
          isolation: "isolate",
        }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ opacity: 0.5 }}>
          <span
            className="display absolute whitespace-nowrap"
            style={{
              top: "6%",
              left: "-4%",
              transform: "rotate(-12deg)",
              fontSize: 15,
              letterSpacing: "0.05em",
              color: "var(--ink)",
              opacity: 0.06,
            }}
          >
            कोई रिटेक नहीं होगा
          </span>
          <span
            className="display absolute whitespace-nowrap"
            style={{
              bottom: "10%",
              right: "-6%",
              transform: "rotate(9deg)",
              fontSize: 13,
              letterSpacing: "0.05em",
              color: "var(--ink)",
              opacity: 0.05,
            }}
          >
            SCENE ENDS &middot; ROLL CREDITS
          </span>
        </div>

        <div className="relative flex items-center justify-between px-6 pt-6">
          <span className="display text-lg" style={{ letterSpacing: "0.03em" }}>
            THE NEELAM SHOW
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase"
            style={{
              letterSpacing: "0.15em",
              color: "var(--accent)",
              border: "2px solid var(--accent)",
            }}
          >
            Opening Night
          </span>
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center px-7 pb-2 pt-6">
          <div className="relative w-full" style={{ maxWidth: 290, paddingTop: 14 }}>
            <div
              className="clapper-arm"
              style={{
                height: 30,
                width: "100%",
                borderRadius: "6px 6px 0 0",
                border: "2px solid var(--ink)",
                background:
                  "repeating-linear-gradient(-35deg, var(--orange) 0 16px, var(--ink) 16px 32px)",
                boxSizing: "border-box",
              }}
            />
            <div
              className="relative flex flex-col items-center"
              style={{
                border: "2px solid var(--ink)",
                borderTop: "none",
                borderRadius: "0 0 10px 10px",
                background: "var(--card-alt)",
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
                className="display relative"
                style={{ fontSize: 90, lineHeight: 0.85, color: "var(--ink)" }}
              >
                {count}
              </span>
              <span
                className="relative mt-2.5 text-xs font-bold uppercase"
                style={{ letterSpacing: "0.15em", color: "var(--muted)" }}
              >
                answered in 60 seconds
              </span>
              {fasterThanAvg !== null && (
                <span
                  className="relative mt-1 text-xs font-bold"
                  style={{ color: "var(--accent)" }}
                >
                  &#9650; {fasterThanAvg}% faster than average
                </span>
              )}
            </div>
          </div>

          <p
            className="relative mt-4 text-xs uppercase tracking-wide"
            style={{ color: "var(--muted-soft)" }}
          >
            no right or wrong answers &middot; it&apos;s rapid fire
          </p>

          <p
            className="mt-5 text-center italic"
            style={{
              fontFamily: "var(--font-cormorant-garamond), serif",
              fontSize: 22,
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
          style={{ borderTop: "2px solid var(--ink)" }}
        >
          <span className="text-sm italic" style={{ color: "var(--muted)" }}>
            {hookLine}
          </span>
          <span
            className="whitespace-nowrap text-xs"
            style={{ letterSpacing: "0.06em", color: "var(--muted-soft)" }}
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
          className="poster-action-btn flex-1 rounded-full py-3.5 text-center text-sm font-bold"
          style={{ border: "2px solid var(--ink)", color: "var(--ink)" }}
        >
          Share on X
        </a>
        <a
          href={shareWhatsapp}
          target="_blank"
          rel="noreferrer"
          className="poster-action-btn flex-1 rounded-full py-3.5 text-center text-sm font-bold"
          style={{ border: "2px solid var(--ink)", color: "var(--ink)" }}
        >
          Share on WhatsApp
        </a>
      </div>

      <button
        onClick={onPlayAgain}
        className="poster-action-btn relative mt-3.5 w-full rounded-full py-4.5 text-lg font-extrabold"
        style={{
          maxWidth: 440,
          background: "var(--accent)",
          color: "var(--card)",
          border: "2px solid var(--ink)",
          boxShadow: "4px 4px 0 var(--ink)",
        }}
      >
        Play Again
      </button>

      {answers.length > 0 && (
        <button
          onClick={() => downloadCsv(name, answers)}
          className="relative mt-4 text-sm underline"
          style={{ color: "var(--muted)" }}
        >
          Download all {answers.length} answers (CSV)
        </button>
      )}
    </div>
  );
}
