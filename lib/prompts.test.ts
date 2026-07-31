import { describe, it, expect } from "vitest";
import { PROMPT_BANK, getNextRoundPrompts } from "./prompts";

describe("getNextRoundPrompts", () => {
  it("returns the requested count", () => {
    const result = getNextRoundPrompts([], 10);
    expect(result).toHaveLength(10);
  });

  it("excludes recently used words when enough fresh words remain", () => {
    const allWords = Object.values(PROMPT_BANK).flat();
    const recentlyUsed = allWords.slice(0, allWords.length - 5);
    const result = getNextRoundPrompts(recentlyUsed, 5);
    result.forEach((word) => {
      expect(recentlyUsed).not.toContain(word);
    });
  });

  it("falls back to the full bank if excluding recent words leaves too few", () => {
    const allWords = Object.values(PROMPT_BANK).flat();
    const result = getNextRoundPrompts(allWords, 20);
    expect(result).toHaveLength(20);
  });

  it("never returns duplicate words in a single round", () => {
    const result = getNextRoundPrompts([], 30);
    expect(new Set(result).size).toBe(result.length);
  });
});
