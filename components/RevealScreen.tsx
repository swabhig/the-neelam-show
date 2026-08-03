"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Answer, PlayerResult } from "@/lib/types";

const WATERMARK = "the-neelam-show.vercel.app";

function downloadCsv(
  filenameBase: string,
  players: { name: string; answers: Answer[] }[]
) {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const multi = players.length > 1;
  const rows = [multi ? "Player,Prompt,Answer" : "Prompt,Answer"];
  for (const p of players) {
    for (const a of p.answers) {
      rows.push(
        multi
          ? `${escape(p.name)},${escape(a.prompt)},${escape(a.text)}`
          : `${escape(a.prompt)},${escape(a.text)}`
      );
    }
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `the-neelam-show-${filenameBase.toLowerCase().replace(/\s+/g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function RevealScreen({
  name,
  deviceId,
  count,
  totalPrompts,
  answers,
  opponent,
  persist = true,
  remoteVerdict,
  basketballScore,
  onPlayAgain,
}: {
  name: string;
  deviceId: string;
  count: number;
  totalPrompts: number;
  answers: Answer[];
  /** Present for pass-and-play (shared device) and remote (separate
   * devices) modes, for the head-to-head result. */
  opponent?: PlayerResult;
  /** Solo mode saves to Convex; pass-and-play and remote never do. */
  persist?: boolean;
  /** Remote mode only: the verdict lives on the shared room doc, written
   * once by whichever player finishes second, so both sides see the
   * identical text - pass `null` while waiting for it to arrive, or omit
   * this prop entirely for solo/pass-and-play (which fetch their own). */
  remoteVerdict?: { verdict: string; hookLine: string } | null;
  /** Remote mode only: baskets sunk in the mini-game while waiting. */
  basketballScore?: number;
  onPlayAgain: () => void;
}) {
  const isRemote = remoteVerdict !== undefined;
  // No real speech captured for anyone - asking the AI for a verdict
  // here just invites it to invent answers nobody actually gave.
  const nobodyAnswered = answers.length === 0 && (opponent?.answers.length ?? 0) === 0;
  const [verdict, setVerdict] = useState(() =>
    nobodyAnswered
      ? opponent
        ? "Total silence on both sides - not a single word landed."
        : "Total silence - not a single word landed this round."
      : "Your brain, unfiltered, on opening night."
  );
  const [hookLine, setHookLine] = useState(() =>
    nobodyAnswered
      ? opponent
        ? "rematch, and actually say something this time"
        : "dare a friend to at least try"
      : "tag someone who'd choke on round 1"
  );
  const displayVerdict = isRemote ? (remoteVerdict?.verdict ?? "revealing…") : verdict;
  const displayHookLine = isRemote ? (remoteVerdict?.hookLine ?? "") : hookLine;
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
  const recordMatch = useMutation(api.matches.recordMatch);

  useEffect(() => {
    if (persist) {
      updateAfterRound({
        deviceId,
        score: count,
        wordsUsed: answers.map((a) => a.prompt),
      });
    }

    if (opponent && !isRemote) {
      recordMatch({
        player1Name: name,
        player1Score: count,
        player2Name: opponent.name,
        player2Score: opponent.count,
      });
    }

    if (!isRemote && !nobodyAnswered) {
      fetch("/api/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          opponent
            ? { name, answers, opponent: { name: opponent.name, answers: opponent.answers } }
            : { name, answers }
        ),
      })
        .then((res) => res.json())
        .then((data: { verdict: string; hookLine: string }) => {
          setVerdict(data.verdict);
          setHookLine(data.hookLine);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareText = opponent
    ? `${name} vs ${opponent.name} on The Neelam Show — ${count} vs ${opponent.count} in 60 seconds. One word, zero thinking time. Rematch?`
    : `I answered ${count} in 60 seconds on The Neelam Show — one word, zero thinking time, no right or wrong answers. Beat me if you can.`;
  const shareX =
    "https://twitter.com/intent/tweet?text=" + encodeURIComponent(shareText);
  const shareWhatsapp =
    "https://wa.me/?text=" + encodeURIComponent(shareText + (opponent ? "" : " 👀"));

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
          minHeight: 420,
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

        <div
          className="relative flex items-center justify-between gap-2 px-6 pt-6"
          style={{ flexWrap: "wrap" }}
        >
          <span
            className="display text-base sm:text-lg"
            style={{ letterSpacing: "0.03em", whiteSpace: "nowrap" }}
          >
            THE NEELAM SHOW
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase sm:px-3 sm:text-xs"
            style={{
              letterSpacing: "0.12em",
              color: "var(--accent)",
              border: "2px solid var(--accent)",
              whiteSpace: "nowrap",
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
              {opponent ? (
                <>
                  <div className="relative flex items-center gap-5">
                    <div className="flex flex-col items-center gap-1">
                      <span className="display" style={{ fontSize: 56, lineHeight: 0.85, color: "var(--ink)" }}>
                        {count}
                      </span>
                      <span className="text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>
                        {name}
                      </span>
                    </div>
                    <span className="display" style={{ fontSize: 22, color: "var(--muted-soft)" }}>
                      vs
                    </span>
                    <div className="flex flex-col items-center gap-1">
                      <span className="display" style={{ fontSize: 56, lineHeight: 0.85, color: "var(--ink)" }}>
                        {opponent.count}
                      </span>
                      <span className="text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>
                        {opponent.name}
                      </span>
                    </div>
                  </div>
                  <span
                    className="relative mt-3 text-xs font-bold uppercase"
                    style={{ letterSpacing: "0.1em", color: "var(--accent)" }}
                  >
                    {count === opponent.count
                      ? "It's a tie!"
                      : count > opponent.count
                        ? `${name} wins!`
                        : `${opponent.name} wins!`}
                  </span>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          <p
            className="relative mt-4 text-xs uppercase tracking-wide"
            style={{ color: "var(--muted-soft)" }}
          >
            no right or wrong answers &middot; it&apos;s rapid fire
          </p>

          {basketballScore !== undefined && basketballScore > 0 && (
            <p
              className="relative mt-1 text-xs font-bold"
              style={{ color: "var(--muted)" }}
            >
              &#127936; sank {basketballScore} while waiting
            </p>
          )}

          <p
            className="mt-5 text-center italic"
            style={{
              fontFamily: "var(--font-cormorant-garamond), serif",
              fontSize: 22,
              lineHeight: 1.35,
              color: "var(--accent)",
              maxWidth: 320,
              display: "-webkit-box",
              WebkitLineClamp: 6,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {displayVerdict}
          </p>
        </div>

        <div
          className="relative flex flex-col gap-1.5 px-6 py-5"
          style={{ borderTop: "2px solid var(--ink)" }}
        >
          <span className="text-sm italic" style={{ color: "var(--muted)" }}>
            {displayHookLine}
          </span>
          <span
            className="text-xs"
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

      {(answers.length > 0 || (opponent?.answers.length ?? 0) > 0) && (
        <button
          onClick={() =>
            downloadCsv(
              opponent ? `${name}-vs-${opponent.name}` : name,
              opponent ? [{ name, answers }, { name: opponent.name, answers: opponent.answers }] : [{ name, answers }]
            )
          }
          className="relative mt-4 text-sm underline"
          style={{ color: "var(--muted)" }}
        >
          Download all {answers.length + (opponent?.answers.length ?? 0)} answers (CSV)
        </button>
      )}
    </div>
  );
}
