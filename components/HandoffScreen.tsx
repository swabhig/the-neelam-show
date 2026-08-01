"use client";

import { useState } from "react";
import type { PlayerResult } from "@/lib/types";

export function HandoffScreen({
  player1,
  onReady,
}: {
  player1: PlayerResult;
  onReady: (player2Name: string) => void;
}) {
  const [name, setName] = useState("");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
      <div
        className="pointer-events-none absolute rounded-full"
        style={{ top: -140, left: -120, width: 320, height: 320, background: "var(--orange)", opacity: 0.3 }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{ bottom: -160, right: -140, width: 320, height: 320, background: "var(--pink)", opacity: 0.25 }}
      />
      <div className="halftone pointer-events-none absolute inset-0" />

      <span
        className="relative text-xs font-bold uppercase tracking-widest"
        style={{ color: "var(--muted)" }}
      >
        {player1.name}&apos;s score
      </span>
      <div
        className="display relative leading-none"
        style={{ color: "var(--accent)", fontSize: "clamp(4rem, 18vw, 6rem)", textShadow: "3px 3px 0 var(--ink)" }}
      >
        {player1.count}
      </div>
      <p className="relative text-lg" style={{ color: "var(--body-text)" }}>
        Pass the phone. Who&apos;s up next?
      </p>

      <div
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-[22px] p-7"
        style={{ background: "var(--card)", border: "2px solid var(--ink)", boxShadow: "6px 6px 0 var(--ink)" }}
      >
        <label className="flex flex-col gap-1.5 text-left">
          <span
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--muted)" }}
          >
            Player 2&apos;s Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul"
            className="rounded-xl px-4 py-3 text-base"
            style={{ background: "#fff", border: "2px solid var(--ink)", color: "var(--ink)" }}
          />
        </label>

        <button
          onClick={() => {
            const trimmed = name.trim();
            if (trimmed) onReady(trimmed);
          }}
          disabled={!name.trim()}
          className="poster-action-btn mt-1 rounded-full py-4 text-lg font-extrabold disabled:opacity-40"
          style={{
            background: "var(--accent)",
            color: "var(--card)",
            border: "2px solid var(--ink)",
            boxShadow: "4px 4px 0 var(--ink)",
          }}
        >
          We&apos;re Ready &rarr;
        </button>
      </div>
    </div>
  );
}
