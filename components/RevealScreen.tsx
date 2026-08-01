"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type Answer = { prompt: string; text: string };

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
      .then((data: { verdict: string; caption: string }) => {
        setVerdict(data.verdict);
        setCaption(data.caption);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareText = caption
    ? `${caption} I answered ${count} in 60 seconds on THE NEELAM SHOW \u{1F440}`
    : `I answered ${count} in 60 seconds on THE NEELAM SHOW \u{1F440}`;

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-12 text-center">
      <p className="bebas text-2xl" style={{ color: "var(--accent)" }}>
        {name} answered
      </p>
      <div className="bebas text-8xl">{count}</div>
      <p className="text-lg">in 60 seconds</p>

      {verdict && (
        <p className="max-w-sm text-lg italic" style={{ color: "var(--accent)" }}>
          {verdict}
        </p>
      )}

      <div className="w-full max-w-sm space-y-2 text-left">
        {answers.map((a, i) => (
          <div key={i} className="flex justify-between border-b pb-1 text-sm" style={{ borderColor: "oklch(0.3 0.02 40)" }}>
            <span style={{ color: "var(--accent)" }}>{a.prompt}</span>
            <span>{a.text}</span>
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-sm gap-3">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-full border py-3 text-sm font-semibold"
          style={{ borderColor: "oklch(0.4 0.02 40)" }}
        >
          Share on X
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-full border py-3 text-sm font-semibold"
          style={{ borderColor: "oklch(0.4 0.02 40)" }}
        >
          Share on WhatsApp
        </a>
      </div>

      <button
        onClick={onPlayAgain}
        className="rounded-full px-10 py-4 text-lg font-bold"
        style={{ background: "var(--accent)", color: "oklch(0.15 0.02 40)" }}
      >
        Play Again
      </button>
    </div>
  );
}
