import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("customers").collect();
  },
});

export const add = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("customers", {
      name: args.name,
      debts: [],
      payments: [],
      balance: 0,
    });
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("customers")),
    name: v.string(),
    debts: v.array(v.any()),
    payments: v.array(v.any()),
    balance: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.id) {
      await ctx.db.patch(args.id, args);
      return args.id;
    }
    return await ctx.db.insert("customers", args);
  },
});
