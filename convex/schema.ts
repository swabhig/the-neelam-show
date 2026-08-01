import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  players: defineTable({
    deviceId: v.string(),
    name: v.string(),
    personalBest: v.number(),
    recentWords: v.array(v.string()),
  }).index("by_device_id", ["deviceId"]),

  // Pass-and-play results only - a shared-device match between two named
  // players, unrelated to any one person's device identity. Never reads
  // from or writes to the players table above, so it can't corrupt a
  // personal-best that belongs to whoever actually owns the device.
  matches: defineTable({
    player1Name: v.string(),
    player1Score: v.number(),
    player2Name: v.string(),
    player2Score: v.number(),
  }),
});
