import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ✅ Get all daily entries
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("dailyEntries").order("desc").collect();
  },
});

// ✅ Add or update today's entry
export const upsert = mutation({
  args: {
    id: v.string(),
    date: v.string(),
    sales: v.array(v.any()),
    debts: v.array(v.any()),
    closed: v.boolean(),
    totals: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyEntries")
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("dailyEntries", args);
    }
  },
});
