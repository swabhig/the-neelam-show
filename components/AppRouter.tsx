"use client";

import { useState } from "react";
import { getDeviceId } from "@/lib/deviceId";
import { NameScreen } from "./NameScreen";
import { Game } from "./Game";
import { RemoteGame } from "./RemoteGame";

type Started = { playerName: string; mode: "solo" | "pass" | "remote" };

export function AppRouter() {
  const [started, setStarted] = useState<Started | null>(null);
  const [deviceId] = useState(() => getDeviceId());

  if (!started) {
    return (
      <NameScreen
        onStart={(playerName, mode) => setStarted({ playerName, mode })}
      />
    );
  }

  if (started.mode === "remote") {
    return (
      <RemoteGame
        playerName={started.playerName}
        deviceId={deviceId}
        onRestart={() => setStarted(null)}
      />
    );
  }

  return (
    <Game
      playerName={started.playerName}
      mode={started.mode}
      onRestart={() => setStarted(null)}
    />
  );
}
