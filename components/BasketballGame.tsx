"use client";

import { useEffect, useRef, useState } from "react";

// The "make" window on the 0-100 power track - tap SHOOT while the
// marker is inside this range to sink it.
const SWEET_SPOT: [number, number] = [42, 58];
const CYCLE_MS = 1400;

type ShotResult = "make" | "miss" | null;

/**
 * Shown while waiting for the opponent to finish their round. A power
 * marker sweeps back and forth on a track; tapping SHOOT while it's in
 * the highlighted zone sinks the basket. Purely a waiting-room diversion
 * - the tally gets carried into the reveal screen as a fun aside, not a
 * real score.
 */
export function BasketballGame({
  onScoreChange,
}: {
  onScoreChange?: (score: number) => void;
}) {
  const [power, setPower] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<ShotResult>(null);
  const lockedRef = useRef(false);
  // Set inside the animation frame callback below, not here - calling
  // performance.now() during render is an impure render side effect.
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    function tick(now: number) {
      if (startTimeRef.current === null) startTimeRef.current = now;
      if (!lockedRef.current) {
        const elapsed = (now - startTimeRef.current) % CYCLE_MS;
        const t = elapsed / CYCLE_MS;
        const p = t < 0.5 ? t * 2 : 2 - t * 2;
        setPower(Math.round(p * 100));
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function handleShoot() {
    if (lockedRef.current) return;
    lockedRef.current = true;

    const isMake = power >= SWEET_SPOT[0] && power <= SWEET_SPOT[1];
    setResult(isMake ? "make" : "miss");
    if (isMake) {
      setScore((s) => {
        const next = s + 1;
        onScoreChange?.(next);
        return next;
      });
    }

    setTimeout(() => {
      setResult(null);
      startTimeRef.current = performance.now();
      lockedRef.current = false;
    }, 800);
  }

  return (
    <div className="relative flex flex-col items-center gap-7 px-6 text-center">
      <span
        className="text-xs font-bold uppercase tracking-[0.2em]"
        style={{ color: "var(--muted)" }}
      >
        waiting for them to finish
      </span>

      <div className="flex items-center gap-3">
        <span className="text-4xl">🏀</span>
        <span className="display text-4xl" style={{ color: "var(--ink)" }}>
          {score}
        </span>
      </div>

      <div
        className="relative w-full max-w-xs rounded-full"
        style={{
          height: 20,
          border: "2px solid var(--ink)",
          background: "var(--card)",
        }}
      >
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: `${SWEET_SPOT[0]}%`,
            width: `${SWEET_SPOT[1] - SWEET_SPOT[0]}%`,
            background: "var(--orange)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: -6,
            left: `calc(${power}% - 6px)`,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "var(--accent)",
            border: "2px solid var(--ink)",
            transition: "left 0.02s linear",
          }}
        />
      </div>

      <div
        className="display text-2xl"
        style={{
          color: result === "make" ? "var(--accent)" : result === "miss" ? "var(--muted-soft)" : "transparent",
          minHeight: 32,
        }}
      >
        {result === "make" ? "SWISH!" : result === "miss" ? "brick." : "-"}
      </div>

      <button
        onClick={handleShoot}
        className="poster-action-btn rounded-full px-10 py-4 text-lg font-extrabold"
        style={{
          background: "var(--accent)",
          color: "var(--card)",
          border: "2px solid var(--ink)",
          boxShadow: "4px 4px 0 var(--ink)",
        }}
      >
        Shoot
      </button>
    </div>
  );
}
