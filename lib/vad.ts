const SPEECH_THRESHOLD = 20; // average byte-frequency amplitude counted as "speaking"
const SILENCE_MS = 500; // how long silence must persist before we call an answer "done"

export function createVAD(
  stream: MediaStream,
  onSpeechStart: () => void,
  onSpeechEnd: () => void
) {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  // Default smoothingTimeConstant (0.8) makes readings decay slowly for
  // ~1-2s after sound actually stops, which would make silence detection
  // lag noticeably. Near-zero smoothing keeps readings tracking the
  // actual current signal, not a trailing average of it.
  analyser.smoothingTimeConstant = 0.1;
  source.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);
  let speaking = false;
  let silenceStart: number | null = null;
  let rafId: number;

  function tick() {
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const avg = sum / data.length;

    if (avg > SPEECH_THRESHOLD) {
      if (!speaking) {
        speaking = true;
        onSpeechStart();
      }
      silenceStart = null;
    } else if (speaking) {
      if (silenceStart === null) {
        silenceStart = performance.now();
      } else if (performance.now() - silenceStart > SILENCE_MS) {
        speaking = false;
        silenceStart = null;
        onSpeechEnd();
      }
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(rafId);
      source.disconnect();
      if (audioContext.state !== "closed") {
        audioContext.close();
      }
    },
  };
}
