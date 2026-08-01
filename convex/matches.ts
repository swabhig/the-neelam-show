import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const recordMatch = mutation({
  args: {
    player1Name: v.string(),
    player1Score: v.number(),
    player2Name: v.string(),
    player2Score: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("matches", args);
  },
});
