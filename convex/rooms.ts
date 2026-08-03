import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Avoids visually ambiguous characters (0/O, 1/I/L) since this gets
// read aloud or typed in by a second person off a phone screen.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export const createRoom = mutation({
  args: { player1Name: v.string() },
  handler: async (ctx, { player1Name }) => {
    // Extremely unlikely to collide at 4 chars from a 32-char alphabet,
    // but retry a few times rather than trust that blindly.
    let code = generateCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (!existing) break;
      code = generateCode();
    }

    const roomId = await ctx.db.insert("rooms", {
      code,
      status: "waiting",
      player1Name,
      player1Count: 0,
      player1Done: false,
    });
    return { roomId, code };
  },
});

export const joinRoom = mutation({
  args: { code: v.string(), player2Name: v.string() },
  handler: async (ctx, { code, player2Name }) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .unique();

    if (!room) return { error: "not_found" as const };
    if (room.player2Name) return { error: "full" as const };

    await ctx.db.patch(room._id, {
      player2Name,
      player2Count: 0,
      player2Done: false,
      status: "playing",
    });
    return { roomId: room._id };
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .unique();
  },
});

export const getById = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    return await ctx.db.get(roomId);
  },
});

export const updateCount = mutation({
  args: {
    roomId: v.id("rooms"),
    player: v.union(v.literal(1), v.literal(2)),
    count: v.number(),
  },
  handler: async (ctx, { roomId, player, count }) => {
    const room = await ctx.db.get(roomId);
    if (!room) return;

    // A live update fires on every single score during the round - over
    // a real mobile network these can arrive at the server out of send
    // order, so a stale "you scored 19" can land after the true "you
    // scored 20" and silently overwrite it. The count only ever goes up
    // during a round, so ignoring any update that isn't actually higher
    // than what's stored makes the result correct regardless of arrival
    // order, without needing sequence numbers.
    const current = player === 1 ? room.player1Count : (room.player2Count ?? 0);
    if (count <= current) return;

    await ctx.db.patch(roomId, player === 1 ? { player1Count: count } : { player2Count: count });
  },
});

export const markDone = mutation({
  args: {
    roomId: v.id("rooms"),
    player: v.union(v.literal(1), v.literal(2)),
    count: v.number(),
    answers: v.array(v.object({ prompt: v.string(), text: v.string() })),
  },
  handler: async (ctx, { roomId, player, count, answers }) => {
    const room = await ctx.db.get(roomId);
    if (!room) return;

    // Same out-of-order concern as updateCount - take whichever count is
    // higher, in case a still-in-flight live update for the true final
    // score hasn't landed yet when this fires.
    const current = player === 1 ? room.player1Count : (room.player2Count ?? 0);
    const finalCount = Math.max(current, count);

    const patch =
      player === 1
        ? { player1Count: finalCount, player1Done: true, player1Answers: answers }
        : { player2Count: finalCount, player2Done: true, player2Answers: answers };
    await ctx.db.patch(roomId, patch);

    const bothDone = player === 1 ? room.player2Done : room.player1Done;
    if (bothDone) {
      await ctx.db.patch(roomId, { status: "done" });
    }
  },
});

export const setVerdict = mutation({
  args: { roomId: v.id("rooms"), verdict: v.string(), hookLine: v.string() },
  handler: async (ctx, { roomId, verdict, hookLine }) => {
    await ctx.db.patch(roomId, { verdict, hookLine });
  },
});
