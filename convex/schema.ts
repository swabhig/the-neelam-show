import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  players: defineTable({
    deviceId: v.string(),
    name: v.string(),
    personalBest: v.number(),
    recentWords: v.array(v.string()),
  }).index("by_device_id", ["deviceId"]),
});
