export function FilmSprocket() {
  return (
    <div
      className="sprocket"
      style={{ position: "relative", width: "100%", height: 14 }}
    />
  );
}

/**
 * A rotated, low-opacity block of filmy dialogue lines - always visible
 * (including mobile), cropped by the parent's overflow:hidden. Meant to
 * sit directly behind a header or footer heading, matching the waitlist
 * page's visual language.
 */
export function DialogueBlock({
  lines,
  rotate = -4,
  fontSize = 30,
}: {
  lines: string[];
  rotate?: number;
  fontSize?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 4,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transform: `rotate(${rotate}deg)`,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className="bebas"
          style={{
            fontSize,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            color: "oklch(0.98 0.01 80)",
            opacity: 0.07,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

export const HEADER_DIALOGUE_LINES = [
  "SILENCE IS NOT AN OPTION · NO RETAKES · SAY IT BEFORE YOU THINK IT",
  "THE MIC DOESN'T WAIT FOR YOU · ONE WORD, NO SECOND TAKES",
  "THE STAGE DOESN'T DO OVERTHINKING · SPEAK NOW OR LOSE THE ROUND",
];

export const FOOTER_DIALOGUE_LINES = [
  "एक चुटकी जवाब की कीमत · NO SCRIPT, NO SAFETY NET",
  "कोई रिहर्सल नहीं · ONE SHOT, NO CUTS",
  "SCENE ENDS · ROLL CREDITS · TAKE A BOW",
];
