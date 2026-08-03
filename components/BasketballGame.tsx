"use client";

import { useEffect, useRef, useState } from "react";
import { startWaitingMusic, stopWaitingMusic } from "@/lib/waitingMusic";

const CYCLE_MS = 1200;
// The ball is "makeable" for the top slice of its bounce - the hoop
// glows during this window so there's a real visual cue to react to,
// same idea as watching an obstacle approach in an endless-runner game
// rather than reading an abstract meter.
const MAKE_THRESHOLD = 0.72;

type ShotResult = "make" | "miss" | null;

/**
 * Shown while waiting for the opponent to finish their round. A ball
 * bounces continuously toward a hoop that glows when it's in reach - tap
 * anywhere while it's glowing to sink it. Every tap gives instant
 * feedback and nothing ever locks out input; misses cost nothing and the
 * ball just keeps bouncing. Purely a waiting-room diversion - the tally
 * gets carried into the reveal screen as a fun aside, not a real score.
 */
export function BasketballGame({
  onScoreChange,
}: {
  onScoreChange?: (score: number) => void;
}) {
  const [height, setHeight] = useState(0); // 0 (ground) to 1 (at hoop)
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<ShotResult>(null);
  const heightRef = useRef(0);
  const celebratingRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    onScoreChange?.(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  useEffect(() => {
    startWaitingMusic();
    return () => stopWaitingMusic();
  }, []);

  useEffect(() => {
    function tick(now: number) {
      if (startTimeRef.current === null) startTimeRef.current = now;
      if (!celebratingRef.current) {
        const elapsed = (now - startTimeRef.current) % CYCLE_MS;
        const t = elapsed / CYCLE_MS;
        // Smooth up-and-down bounce, 0 -> 1 -> 0 each cycle.
        const h = Math.sin(t * Math.PI);
        heightRef.current = h;
        setHeight(h);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    };
  }, []);

  function handleShoot() {
    const isMake = heightRef.current >= MAKE_THRESHOLD;
    clearTimeout(resultTimeoutRef.current);

    if (isMake) {
      // Brief celebratory pause only on a make - success feels rewarding
      // to pause on, but a miss should never cost the player anything,
      // so misses don't interrupt the rhythm at all.
      celebratingRef.current = true;
      setResult("make");
      setScore((s) => s + 1);
      resultTimeoutRef.current = setTimeout(() => {
        setResult(null);
        celebratingRef.current = false;
        startTimeRef.current = performance.now();
      }, 500);
    } else {
      setResult("miss");
      resultTimeoutRef.current = setTimeout(() => setResult(null), 300);
    }
  }

  const isGlowing = height >= MAKE_THRESHOLD && result !== "make";

  return (
    <div className="relative flex flex-col items-center gap-5 px-6 text-center">
      <span
        className="text-xs font-bold uppercase tracking-[0.2em]"
        style={{ color: "var(--muted)" }}
      >
        waiting for them to finish
      </span>

      <div className="flex items-center gap-3">
        <span className="text-3xl">🏀</span>
        <span className="display text-4xl" style={{ color: "var(--ink)" }}>
          {score}
        </span>
      </div>

      <p className="text-sm font-semibold" style={{ color: "var(--muted)", maxWidth: 260 }}>
        Tap when the ball&apos;s near the hoop
      </p>

      <button
        onClick={handleShoot}
        className="relative flex w-full max-w-xs select-none flex-col items-center justify-end"
        style={{
          height: 220,
          touchAction: "manipulation",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        {/* Hoop */}
        <div
          className="absolute rounded-full"
          style={{
            top: 8,
            width: 72,
            height: 14,
            border: "3px solid var(--ink)",
            borderTop: "none",
            background: "var(--card)",
            boxShadow: isGlowing ? "0 0 0 8px var(--accent-glow)" : "none",
            transition: "box-shadow 0.15s ease",
          }}
        />
        <div
          className="absolute"
          style={{
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 72,
            height: 3,
            background: "var(--ink)",
          }}
        />

        {/* Ball, animated by height (0 = ground, 1 = at hoop) */}
        <div
          className="absolute text-4xl"
          style={{
            bottom: `${8 + height * 150}px`,
            left: "50%",
            transform: `translateX(-50%) scale(${result === "make" ? 0.6 : 1})`,
            opacity: result === "make" ? 0 : 1,
            transition: result === "make" ? "opacity 0.3s ease, transform 0.3s ease" : "none",
          }}
        >
          🏀
        </div>

        {/* Ground line */}
        <div
          className="absolute bottom-0 w-full rounded-full"
          style={{ height: 3, background: "var(--muted-soft)", opacity: 0.4 }}
        />
      </button>

      <div
        className="display text-2xl"
        style={{
          color: result === "make" ? "var(--accent)" : result === "miss" ? "var(--muted-soft)" : "transparent",
          minHeight: 32,
        }}
      >
        {result === "make" ? "SWISH!" : result === "miss" ? "brick." : "-"}
      </div>
    </div>
  );
}
