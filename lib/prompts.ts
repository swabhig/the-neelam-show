export type Category =
  | "bollywood"
  | "relationships"
  | "work"
  | "childhood"
  | "random";

export const PROMPT_BANK: Record<Category, string[]> = {
  bollywood: [
    "shahrukh", "karan", "ott", "item", "award", "baarish", "reels",
    "cameo", "rom-com", "dialogue", "filmy", "blockbuster", "ex-costars",
    "item-song", "interval", "front-bencher",
  ],
  relationships: [
    "crush", "ex", "situationship", "breakup", "in-laws", "shaadi",
    "single", "jalan", "patch-up", "first-love", "secret-admirer",
    "arranged-match", "best-friend's-ex", "childhood-crush",
    "family-secret", "one-sided",
  ],
  work: [
    "monday", "boss", "appraisal", "istifa", "gossip", "deadline", "zoom",
    "promotion", "wfh", "side-hustle", "rent", "emi", "notice-period",
    "office-politics", "chai-break",
  ],
  childhood: [
    "recess", "tuition", "report-card", "best-friend", "cartoon-network",
    "summer-vacation", "cousin's-house", "grandma's-stories",
    "school-crush", "class-monitor", "tiffin-swap", "birthday-party",
  ],
  random: [
    "traffic", "diwali", "wifi", "cricket", "chai", "cousin", "exam",
    "samosa", "roadtrip", "biryani", "potluck", "karaoke", "gully",
    "meme", "selfie", "rickshaw", "powercut", "mausi", "dhaba", "filmi",
    "jugaad", "momo", "chaiwala", "autowala", "gharwala", "tiffin",
    "ladoo", "rangoli", "garba", "kulfi", "paani-puri", "thela",
    "mehendi", "sangeet", "bhangra", "dandiya", "holi", "rakhi",
    "punchline", "meme-page", "insta-reel", "trending", "viral",
    "oversharing", "overthinking",
  ],
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Builds a fresh prompt queue for one round, avoiding words the player
 * has seen recently (last 1-2 sessions). Falls back to the full bank
 * if excluding recent words would leave too few to fill a round.
 */
export function getNextRoundPrompts(
  recentlyUsed: string[],
  count = 40
): string[] {
  const allWords = Object.values(PROMPT_BANK).flat();
  const fresh = allWords.filter((word) => !recentlyUsed.includes(word));
  const pool = fresh.length >= count ? fresh : allWords;
  return shuffle(pool).slice(0, count);
}
