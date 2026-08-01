"use client";

import { NameScreen } from "@/components/NameScreen";

export default function Home() {
  return (
    <NameScreen
      onStart={(name, language) => {
        // Temporary until Task 13 wires in the full Game state machine.
        console.log("started", name, language);
      }}
    />
  );
}
