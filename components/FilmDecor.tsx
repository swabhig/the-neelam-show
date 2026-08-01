"use client";

import { useEffect, useState } from "react";

// Deterministic pseudo-random, seeded by a stable string (the word
// itself + position) - avoids Math.random(), which would produce a
// different value on the server render vs the client and break hydration.
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

function WordSpan({
  word,
  seed,
  fontSize,
  opacity,
}: {
  word: string;
  seed: string;
  fontSize: number;
  opacity: number;
}) {
  const [bright, setBright] = useState(false);
  const peak = Math.min(0.4, opacity * 4);

  useEffect(() => {
    // Plain JS-driven pulse (not CSS @keyframes) - each word gets its own
    // staggered timer so they don't all glow in unison, ambient and
    // automatic so it works on touch devices too, where :hover can
    // never fire (no mouse pointer to hover with).
    const initialDelay = seededRandom(seed) * 5000;
    const cycleMs = 3000 + seededRandom(seed + "-cycle") * 2500;
    let interval: ReturnType<typeof setInterval> | undefined;

    const startTimer = setTimeout(() => {
      setBright(true);
      interval = setInterval(() => setBright((b) => !b), cycleMs);
    }, initialDelay);

    return () => {
      clearTimeout(startTimer);
      if (interval) clearInterval(interval);
    };
  }, [seed]);

  return (
    <span
      className="filmy-word bebas"
      style={{
        fontSize,
        color: "oklch(0.98 0.01 80)",
        opacity: bright ? peak : opacity,
        transition: "opacity 2.5s ease-in-out",
      }}
    >
      {word}
    </span>
  );
}

export function FilmSprocket() {
  return (
    <div
      className="sprocket"
      style={{ position: "relative", width: "100%", height: 14 }}
    />
  );
}

/**
 * A rotated, low-opacity block of filmy dialogue lines - always visible
 * (including mobile), cropped by the parent's overflow:hidden. Each word
 * is its own span so hovering brightens just that word (desktop), same
 * as the waitlist page's decorative text.
 */
export function DialogueBlock({
  lines,
  rotate = -4,
  fontSize = 30,
}: {
  lines: string[];
  rotate?: number;
  fontSize?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 4,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transform: `rotate(${rotate}deg)`,
        overflow: "hidden",
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontSize,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {line.split(" ").map((word, j) => (
            <span key={j}>
              <WordSpan
                word={word}
                seed={`${i}-${j}-${word}`}
                fontSize={fontSize}
                opacity={0.07}
              />{" "}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

type ScatterLine = {
  text: string;
  top: string;
  left?: string;
  right?: string;
  rotate: number;
  fontSize: number;
  opacity: number;
};

const SCATTER_LINES: ScatterLine[] = [
  { text: "कोई रिटेक नहीं होगा", top: "6%", left: "4%", rotate: -14, fontSize: 22, opacity: 0.09 },
  { text: "बड़े-बड़े शहरों में ऐसी छोटी-छोटी बातें होती हैं", top: "12%", right: "3%", rotate: 10, fontSize: 20, opacity: 0.08 },
  { text: "नाम तो सुना ही होगा", top: "34%", right: "2%", rotate: -8, fontSize: 20, opacity: 0.08 },
  { text: "Talk first, think never", top: "22%", left: "2%", rotate: 6, fontSize: 20, opacity: 0.08 },
  { text: "सोचने का टाइम खतम", top: "52%", right: "4%", rotate: 9, fontSize: 20, opacity: 0.08 },
  { text: "Roll camera, no pause button", top: "44%", left: "4%", rotate: -6, fontSize: 20, opacity: 0.08 },
  { text: "एक चुटकी जवाब की कीमत", top: "68%", left: "3%", rotate: -9, fontSize: 20, opacity: 0.08 },
  { text: "जीतने वाला ही असली हीरो", top: "82%", right: "3%", rotate: 11, fontSize: 20, opacity: 0.08 },
  { text: "FADE IN: YOUR BIG MOMENT", top: "90%", left: "4%", rotate: -3, fontSize: 18, opacity: 0.07 },
];

/**
 * Full-viewport scattered dialogue snippets, desktop only (hidden on
 * mobile via CSS so it never crowds the small screen most players will
 * actually use) - matches the waitlist page's decorative background.
 * Per-word spans so each word brightens individually on hover.
 */
export function ScatteredDialogue() {
  return (
    <div className="filmy-scatter" style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      {SCATTER_LINES.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            right: s.right,
            transform: `rotate(${s.rotate}deg)`,
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
          }}
        >
          {s.text.split(" ").map((word, j) => (
            <span key={j}>
              <WordSpan
                word={word}
                seed={`${i}-${j}-${word}`}
                fontSize={s.fontSize}
                opacity={s.opacity}
              />{" "}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export const HEADER_DIALOGUE_LINES = [
  "SILENCE IS NOT AN OPTION · NO RETAKES · SAY IT BEFORE YOU THINK IT",
  "THE MIC DOESN'T WAIT FOR YOU · ONE WORD, NO SECOND TAKES",
  "THE STAGE DOESN'T DO OVERTHINKING · SPEAK NOW OR LOSE THE ROUND",
  "NO SCRIPT, NO CUE CARDS · JUST SAY THE FIRST THING, FILMSTAR",
];

export const FOOTER_DIALOGUE_LINES = [
  "एक चुटकी जवाब की कीमत · NO SCRIPT, NO SAFETY NET",
  "कोई रिहर्सल नहीं · ONE SHOT, NO CUTS",
  "SCENE ENDS · ROLL CREDITS · TAKE A BOW",
  "अगला सीन तुम्हारा है · YOUR CLOSE-UP IS WAITING",
];
