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

  // Remote play - two separate devices, live. Both phones subscribe to
  // the same room doc, which is how each side sees the other's live
  // score (for floating reactions) and knows when both are done (to
  // reveal). Also disconnected from the players table, same reasoning
  // as matches above - a room isn't tied to one person's device.
  rooms: defineTable({
    code: v.string(),
    status: v.union(v.literal("waiting"), v.literal("playing"), v.literal("done")),
    player1Name: v.string(),
    player1Count: v.number(),
    player1Done: v.boolean(),
    player1Answers: v.optional(v.array(v.object({ prompt: v.string(), text: v.string() }))),
    player2Name: v.optional(v.string()),
    player2Count: v.optional(v.number()),
    player2Done: v.optional(v.boolean()),
    player2Answers: v.optional(v.array(v.object({ prompt: v.string(), text: v.string() }))),
    verdict: v.optional(v.string()),
    hookLine: v.optional(v.string()),
  }).index("by_code", ["code"]),
});
