"use client";

import { useEffect, useRef, useState } from "react";

const REACTION_EMOJI = ["🔥", "😳", "👀", "💀", "⚡", "🫣"];

type Burst = { id: number; emoji: string; left: number };

/**
 * Renders nothing itself - just watches `triggerCount` (the opponent's
 * live score) and fires a floating emoji burst every time it goes up.
 * No numbers ever shown here on purpose - the whole point is a felt
 * sense of the opponent's pace, not a rival scoreboard.
 */
export function FloatingReactions({ triggerCount }: { triggerCount: number }) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const prevCount = useRef(triggerCount);
  const nextId = useRef(0);

  useEffect(() => {
    if (triggerCount > prevCount.current) {
      const id = nextId.current++;
      const emoji = REACTION_EMOJI[Math.floor(Math.random() * REACTION_EMOJI.length)];
      const left = 20 + Math.random() * 60;
      setBursts((b) => [...b, { id, emoji, left }]);
      setTimeout(() => {
        setBursts((b) => b.filter((burst) => burst.id !== id));
      }, 1800);
    }
    prevCount.current = triggerCount;
  }, [triggerCount]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50"
      style={{ height: "60vh" }}
    >
      {bursts.map((burst) => (
        <span
          key={burst.id}
          className="floating-reaction absolute bottom-0"
          style={{ left: `${burst.left}%`, fontSize: 36 }}
        >
          {burst.emoji}
        </span>
      ))}
    </div>
  );
}
