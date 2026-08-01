import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreate = mutation({
  args: { deviceId: v.string(), name: v.string() },
  handler: async (ctx, { deviceId, name }) => {
    const existing = await ctx.db
      .query("players")
      .withIndex("by_device_id", (q) => q.eq("deviceId", deviceId))
      .unique();

    if (existing) return existing;

    const id = await ctx.db.insert("players", {
      deviceId,
      name,
      personalBest: 0,
      recentWords: [],
    });
    return await ctx.db.get(id);
  },
});

export const getByDeviceId = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    return await ctx.db
      .query("players")
      .withIndex("by_device_id", (q) => q.eq("deviceId", deviceId))
      .unique();
  },
});

export const updateAfterRound = mutation({
  args: {
    deviceId: v.string(),
    score: v.number(),
    wordsUsed: v.array(v.string()),
  },
  handler: async (ctx, { deviceId, score, wordsUsed }) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_device_id", (q) => q.eq("deviceId", deviceId))
      .unique();
    if (!player) return;

    // keep a rolling window of the last ~2 sessions' worth of words
    const recentWords = [...player.recentWords, ...wordsUsed].slice(-80);

    await ctx.db.patch(player._id, {
      personalBest: Math.max(player.personalBest, score),
      recentWords,
    });
  },
});
