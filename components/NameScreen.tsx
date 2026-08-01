"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getDeviceId } from "@/lib/deviceId";

export function NameScreen({
  onStart,
}: {
  onStart: (name: string, language: "english" | "hinglish") => void;
}) {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<"english" | "hinglish">(
    "english"
  );
  const getOrCreate = useMutation(api.players.getOrCreate);

  async function handleStart() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await getOrCreate({ deviceId: getDeviceId(), name: trimmed });
    onStart(trimmed, language);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="bebas text-6xl leading-none">
        THE NEELAM
        <br />
        SHOW
      </h1>
      <p className="max-w-xs text-lg">
        One word. Zero thinking time. What should we call you?
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Priya"
        className="w-full max-w-xs rounded-xl border px-4 py-3 text-lg"
        style={{
          background: "oklch(0.14 0.02 40)",
          borderColor: "oklch(0.35 0.02 40)",
          color: "var(--ink)",
        }}
      />
      <div className="flex gap-2">
        {(["english", "hinglish"] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className="rounded-full border px-4 py-2 text-sm"
            style={{
              borderColor: "var(--accent)",
              background: language === lang ? "var(--accent)" : "transparent",
              color: language === lang ? "oklch(0.15 0.02 40)" : "var(--ink)",
            }}
          >
            {lang === "english" ? "English" : "Hindi + English"}
          </button>
        ))}
      </div>
      <button
        onClick={handleStart}
        disabled={!name.trim()}
        className="rounded-full px-10 py-4 text-lg font-bold disabled:opacity-40"
        style={{ background: "var(--accent)", color: "oklch(0.15 0.02 40)" }}
      >
        Start &rarr;
      </button>
    </div>
  );
}
