"use client";

// A soft, looping instrumental chord pad for waiting-room moments -
// generic "elevator/lobby hold music" energy. Synthesized entirely
// client-side (Web Audio oscillators + gain envelopes) rather than
// embedding a real recording, since a real song would need a license we
// don't have. Cmaj7 - Am7 - Fmaj7 - G7, a classic soft/easy-listening
// progression, held long enough per chord to feel calm, not looping fast
// enough to feel jingly or annoying.

const CHORDS: number[][] = [
  [130.81, 164.81, 196.0, 246.94], // Cmaj7
  [220.0, 261.63, 329.63, 392.0], // Am7 (octave up for gentle lift)
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [196.0, 246.94, 293.66, 349.23], // G7
];

const CHORD_SECONDS = 3.6;
const FADE_SECONDS = 0.6;
const NOTE_VOLUME = 0.05; // kept low since 4 notes stack per chord

let audioCtx: AudioContext | null = null;
let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
let running = false;

function playChord(ctx: AudioContext, freqs: number[], startAt: number) {
  freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(NOTE_VOLUME, startAt + FADE_SECONDS);
    gain.gain.setValueAtTime(NOTE_VOLUME, startAt + CHORD_SECONDS - FADE_SECONDS);
    gain.gain.linearRampToValueAtTime(0, startAt + CHORD_SECONDS);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + CHORD_SECONDS + 0.05);
  });
}

function scheduleLoop() {
  if (!audioCtx || !running) return;
  const ctx = audioCtx;
  const startAt = ctx.currentTime + 0.05;
  CHORDS.forEach((chord, i) => playChord(ctx, chord, startAt + i * CHORD_SECONDS));

  const loopDurationMs = CHORDS.length * CHORD_SECONDS * 1000;
  schedulerTimer = setTimeout(scheduleLoop, loopDurationMs);
}

export function startWaitingMusic() {
  if (running || typeof window === "undefined") return;
  running = true;
  audioCtx = new AudioContext();
  scheduleLoop();
}

export function stopWaitingMusic() {
  if (!running) return;
  running = false;
  if (schedulerTimer) clearTimeout(schedulerTimer);
  schedulerTimer = null;
  const ctx = audioCtx;
  audioCtx = null;
  if (ctx) setTimeout(() => ctx.close(), 200);
}
