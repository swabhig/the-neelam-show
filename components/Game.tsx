"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getDeviceId } from "@/lib/deviceId";
import type { PlayerResult } from "@/lib/types";
import { NameScreen } from "./NameScreen";
import { PlayScreen } from "./PlayScreen";
import { HandoffScreen } from "./HandoffScreen";
import { RevealScreen } from "./RevealScreen";

type Stage =
  | { name: "name" }
  | {
      name: "playing";
      playerName: string;
      language: "english" | "hinglish";
      mode: "solo" | "pass";
      excludeWords: string[];
      // Set once player 1's round has already finished, so the round-end
      // handler knows this "playing" stage belongs to player 2.
      player1?: PlayerResult;
    }
  | { name: "handoff"; language: "english" | "hinglish"; player1: PlayerResult }
  | { name: "reveal"; mode: "solo" | "pass"; player1: PlayerResult; player2?: PlayerResult };

export function Game() {
  const [stage, setStage] = useState<Stage>({ name: "name" });
  const [deviceId] = useState(() => getDeviceId());
  const player = useQuery(api.players.getByDeviceId, { deviceId });

  if (stage.name === "name") {
    return (
      <NameScreen
        onStart={(playerName, language, mode) =>
          setStage({
            name: "playing",
            playerName,
            language,
            mode,
            excludeWords: player?.recentWords ?? [],
          })
        }
      />
    );
  }

  if (stage.name === "playing") {
    return (
      <PlayScreen
        name={stage.playerName}
        language={stage.language}
        recentWords={stage.excludeWords}
        onRoundEnd={({ count, totalPrompts, answers }) => {
          const result: PlayerResult = { name: stage.playerName, count, totalPrompts, answers };
          if (stage.mode === "solo") {
            setStage({ name: "reveal", mode: "solo", player1: result });
          } else if (!stage.player1) {
            setStage({ name: "handoff", language: stage.language, player1: result });
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
            language: stage.language,
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
      onPlayAgain={() => setStage({ name: "name" })}
    />
  );
}
