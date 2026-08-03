"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { PlayerResult } from "@/lib/types";
import { RemoteLobbyScreen } from "./RemoteLobbyScreen";
import { PlayScreen } from "./PlayScreen";
import { FloatingReactions } from "./FloatingReactions";
import { BasketballGame } from "./BasketballGame";
import { RevealScreen } from "./RevealScreen";

type Stage =
  | { name: "lobby" }
  | { name: "playing"; roomId: Id<"rooms">; player: 1 | 2 }
  | { name: "afterMyRound"; roomId: Id<"rooms">; player: 1 | 2; myResult: PlayerResult };

export function RemoteGame({
  playerName,
  deviceId,
  onRestart,
}: {
  playerName: string;
  deviceId: string;
  onRestart: () => void;
}) {
  const [stage, setStage] = useState<Stage>({ name: "lobby" });
  const [basketballScore, setBasketballScore] = useState(0);
  const updateCount = useMutation(api.rooms.updateCount);
  const markDone = useMutation(api.rooms.markDone);
  const setVerdict = useMutation(api.rooms.setVerdict);
  const verdictRequested = useRef(false);

  const roomId = stage.name !== "lobby" ? stage.roomId : null;
  const room = useQuery(api.rooms.getById, roomId ? { roomId } : "skip");

  const isDone = room?.status === "done";

  useEffect(() => {
    if (!room || !isDone || verdictRequested.current || room.verdict) return;
    if (!room.player1Answers || !room.player2Answers || !room.player2Name) return;

    verdictRequested.current = true;

    if (room.player1Answers.length === 0 && room.player2Answers.length === 0) {
      // No real speech captured for either player - asking the AI here
      // just invites it to invent answers nobody actually gave.
      setVerdict({
        roomId: room._id,
        verdict: "Total silence on both sides - not a single word landed.",
        hookLine: "rematch, and actually say something this time",
      });
      return;
    }

    fetch("/api/verdict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: room.player1Name,
        answers: room.player1Answers,
        opponent: { name: room.player2Name, answers: room.player2Answers },
      }),
    })
      .then((res) => res.json())
      .then((data: { verdict: string; hookLine: string }) => {
        setVerdict({ roomId: room._id, verdict: data.verdict, hookLine: data.hookLine });
      });
  }, [room, isDone, setVerdict]);

  if (stage.name === "lobby") {
    return (
      <RemoteLobbyScreen
        name={playerName}
        onReady={(roomId, player) => setStage({ name: "playing", roomId, player })}
      />
    );
  }

  if (stage.name === "playing") {
    const opponentCount =
      (stage.player === 1 ? room?.player2Count : room?.player1Count) ?? 0;
    return (
      <div className="relative">
        <PlayScreen
          name={playerName}
          recentWords={[]}
          onScore={(count) => updateCount({ roomId: stage.roomId, player: stage.player, count })}
          onRoundEnd={({ count, totalPrompts, answers }) => {
            const myResult: PlayerResult = { name: playerName, count, totalPrompts, answers };
            markDone({ roomId: stage.roomId, player: stage.player, count, answers });
            setStage({ name: "afterMyRound", roomId: stage.roomId, player: stage.player, myResult });
          }}
        />
        <FloatingReactions triggerCount={opponentCount} />
      </div>
    );
  }

  // afterMyRound: either still waiting on the opponent (show the
  // basketball diversion + their live reactions) or both are done (show
  // the shared head-to-head reveal, sourced from the room doc).
  if (!isDone) {
    const opponentCount =
      (stage.player === 1 ? room?.player2Count : room?.player1Count) ?? 0;
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <BasketballGame onScoreChange={setBasketballScore} />
        <FloatingReactions triggerCount={opponentCount} />
      </div>
    );
  }

  const opponentResult: PlayerResult | undefined = room
    ? stage.player === 1
      ? {
          name: room.player2Name ?? "Opponent",
          count: room.player2Count ?? 0,
          totalPrompts: 0,
          answers: room.player2Answers ?? [],
        }
      : {
          name: room.player1Name,
          count: room.player1Count,
          totalPrompts: 0,
          answers: room.player1Answers ?? [],
        }
    : undefined;

  return (
    <RevealScreen
      name={stage.myResult.name}
      deviceId={deviceId}
      count={stage.myResult.count}
      totalPrompts={stage.myResult.totalPrompts}
      answers={stage.myResult.answers}
      opponent={opponentResult}
      persist={false}
      remoteVerdict={room?.verdict ? { verdict: room.verdict, hookLine: room.hookLine ?? "" } : null}
      basketballScore={basketballScore}
      onPlayAgain={onRestart}
    />
  );
}
