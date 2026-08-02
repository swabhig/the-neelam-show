"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getDeviceId } from "@/lib/deviceId";
import type { PlayerResult } from "@/lib/types";
import { PlayScreen } from "./PlayScreen";
import { HandoffScreen } from "./HandoffScreen";
import { RevealScreen } from "./RevealScreen";

type Stage =
  | {
      name: "playing";
      playerName: string;
      mode: "solo" | "pass";
      excludeWords: string[];
      // Set once player 1's round has already finished, so the round-end
      // handler knows this "playing" stage belongs to player 2.
      player1?: PlayerResult;
    }
  | { name: "handoff"; player1: PlayerResult }
  | { name: "reveal"; mode: "solo" | "pass"; player1: PlayerResult; player2?: PlayerResult };

export function Game({
  playerName,
  mode,
  onRestart,
}: {
  playerName: string;
  mode: "solo" | "pass";
  /** Sends the player back to the landing screen for a fresh name/mode
   * choice, rather than silently replaying with the same settings. */
  onRestart: () => void;
}) {
  const [deviceId] = useState(() => getDeviceId());
  const player = useQuery(api.players.getByDeviceId, { deviceId });
  const [stage, setStage] = useState<Stage>(() => ({
    name: "playing",
    playerName,
    mode,
    // player's Convex history may not have loaded yet at this exact
    // moment - falls back to no exclusions rather than blocking start.
    excludeWords: player?.recentWords ?? [],
  }));

  if (stage.name === "playing") {
    return (
      <PlayScreen
        name={stage.playerName}
        recentWords={stage.excludeWords}
        onRoundEnd={({ count, totalPrompts, answers }) => {
          const result: PlayerResult = { name: stage.playerName, count, totalPrompts, answers };
          if (stage.mode === "solo") {
            setStage({ name: "reveal", mode: "solo", player1: result });
          } else if (!stage.player1) {
            setStage({ name: "handoff", player1: result });
          } else {
            setStage({ name: "reveal", mode: "pass", player1: stage.player1, player2: result });
          }
        }}
      />
    );
  }

  if (stage.name === "handoff") {
    return (
      <HandoffScreen
        player1={stage.player1}
        onReady={(player2Name) =>
          setStage({
            name: "playing",
            playerName: player2Name,
            mode: "pass",
            excludeWords: stage.player1.answers.map((a) => a.prompt),
            player1: stage.player1,
          })
        }
      />
    );
  }

  return (
    <RevealScreen
      name={stage.player1.name}
      deviceId={deviceId}
      count={stage.player1.count}
      totalPrompts={stage.player1.totalPrompts}
      answers={stage.player1.answers}
      opponent={stage.player2}
      persist={stage.mode === "solo"}
      onPlayAgain={onRestart}
    />
  );
}
