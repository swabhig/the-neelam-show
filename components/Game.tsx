"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getDeviceId } from "@/lib/deviceId";
import { NameScreen } from "./NameScreen";
import { PlayScreen } from "./PlayScreen";
import { RevealScreen } from "./RevealScreen";

type Stage =
  | { name: "name" }
  | { name: "playing"; playerName: string; language: "english" | "hinglish" }
  | {
      name: "reveal";
      playerName: string;
      count: number;
      totalPrompts: number;
      answers: { prompt: string; text: string }[];
    };

export function Game() {
  const [stage, setStage] = useState<Stage>({ name: "name" });
  const [deviceId] = useState(() => getDeviceId());
  const player = useQuery(api.players.getByDeviceId, { deviceId });

  if (stage.name === "name") {
    return (
      <NameScreen
        onStart={(playerName, language) =>
          setStage({ name: "playing", playerName, language })
        }
      />
    );
  }

  if (stage.name === "playing") {
    return (
      <PlayScreen
        name={stage.playerName}
        language={stage.language}
        recentWords={player?.recentWords ?? []}
        onRoundEnd={({ count, totalPrompts, answers }) =>
          setStage({
            name: "reveal",
            playerName: stage.playerName,
            count,
            totalPrompts,
            answers,
          })
        }
      />
    );
  }

  return (
    <RevealScreen
      name={stage.playerName}
      deviceId={deviceId}
      count={stage.count}
      totalPrompts={stage.totalPrompts}
      answers={stage.answers}
      onPlayAgain={() => setStage({ name: "name" })}
    />
  );
}
