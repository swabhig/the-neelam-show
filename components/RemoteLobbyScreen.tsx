"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Step = "choice" | "waiting" | "join-input";

export function RemoteLobbyScreen({
  name,
  onReady,
}: {
  name: string;
  onReady: (roomId: Id<"rooms">, player: 1 | 2) => void;
}) {
  const [step, setStep] = useState<Step>("choice");
  const [roomId, setRoomId] = useState<Id<"rooms"> | null>(null);
  const [code, setCode] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const room = useQuery(api.rooms.getById, roomId ? { roomId } : "skip");

  useEffect(() => {
    if (step === "waiting" && room?.player2Name && roomId) {
      onReady(roomId, 1);
    }
  }, [step, room?.player2Name, roomId, onReady]);

  async function handleCreate() {
    const result = await createRoom({ player1Name: name });
    setRoomId(result.roomId);
    setCode(result.code);
    setStep("waiting");
  }

  async function handleJoin() {
    setJoinError(null);
    const trimmed = joinCodeInput.trim().toUpperCase();
    if (!trimmed) return;
    setJoining(true);
    const result = await joinRoom({ code: trimmed, player2Name: name });
    setJoining(false);
    if ("error" in result) {
      setJoinError(
        result.error === "full"
          ? "That room's already full."
          : "Couldn't find that room - check the code."
      );
      return;
    }
    onReady(result.roomId, 2);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
      <div
        className="pointer-events-none absolute rounded-full"
        style={{ top: -140, left: -120, width: 320, height: 320, background: "var(--blue)", opacity: 0.3 }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{ bottom: -160, right: -140, width: 320, height: 320, background: "var(--orange)", opacity: 0.25 }}
      />
      <div className="halftone pointer-events-none absolute inset-0" />

      {step === "choice" && (
        <>
          <span
            className="relative text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            Remote-play
          </span>
          <h2 className="display relative text-4xl" style={{ color: "var(--ink)" }}>
            Create or join?
          </h2>
          <div className="relative flex w-full max-w-sm flex-col gap-3">
            <button
              onClick={handleCreate}
              className="poster-action-btn rounded-full py-4 text-lg font-extrabold"
              style={{
                background: "var(--accent)",
                color: "var(--card)",
                border: "2px solid var(--ink)",
                boxShadow: "4px 4px 0 var(--ink)",
              }}
            >
              Create Room
            </button>
            <button
              onClick={() => setStep("join-input")}
              className="poster-action-btn rounded-full py-4 text-lg font-extrabold"
              style={{
                background: "var(--card)",
                color: "var(--ink)",
                border: "2px solid var(--ink)",
                boxShadow: "4px 4px 0 var(--ink)",
              }}
            >
              Join Room
            </button>
          </div>
        </>
      )}

      {step === "join-input" && (
        <>
          <span
            className="relative text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            Remote-play
          </span>
          <h2 className="display relative text-4xl" style={{ color: "var(--ink)" }}>
            Enter the code
          </h2>
          <div
            className="relative flex w-full max-w-sm flex-col gap-4 rounded-[22px] p-7"
            style={{ background: "var(--card)", border: "2px solid var(--ink)", boxShadow: "6px 6px 0 var(--ink)" }}
          >
            <input
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. 7K3P"
              maxLength={4}
              className="display rounded-xl px-4 py-3 text-center text-2xl tracking-[0.3em]"
              style={{ background: "#fff", border: "2px solid var(--ink)", color: "var(--ink)" }}
            />
            {joinError && (
              <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                {joinError}
              </span>
            )}
            <button
              onClick={handleJoin}
              disabled={!joinCodeInput.trim() || joining}
              className="poster-action-btn rounded-full py-4 text-lg font-extrabold disabled:opacity-40"
              style={{
                background: "var(--accent)",
                color: "var(--card)",
                border: "2px solid var(--ink)",
                boxShadow: "4px 4px 0 var(--ink)",
              }}
            >
              {joining ? "Joining…" : "Join"}
            </button>
          </div>
        </>
      )}

      {step === "waiting" && (
        <>
          <span
            className="relative text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            Share this code
          </span>
          <div
            className="display relative"
            style={{ fontSize: 72, letterSpacing: "0.15em", color: "var(--accent)", textShadow: "3px 3px 0 var(--ink)" }}
          >
            {code}
          </div>
          <div className="relative flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--accent)", animation: "badgePulse 2s ease-in-out infinite" }}
            />
            <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
              waiting for your opponent to join…
            </p>
          </div>
        </>
      )}
    </div>
  );
}
