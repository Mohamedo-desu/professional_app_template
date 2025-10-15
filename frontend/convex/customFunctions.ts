import {
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { tryGetAuthenticatedUser } from "./users";

/**
 * 🧩 Utility: Fetch businesses owned by a user
 */
async function getUserBusinesses(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  const businesses = await ctx.db
    .query("businesses")
    .withIndex("by_owner", (q) => q.eq("ownerId", userId))
    .collect();

  return businesses;
}

/**
 * 🔐 Authenticated Query: Requires login
 * Injects user + single business (if available)
 */
export const authenticatedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await tryGetAuthenticatedUser(ctx);
    if (!user) {
      throw new Error(
        "Authentication required. Please log in to access this resource."
      );
    }

    const businesses = await getUserBusinesses(ctx, user._id);
    const business = businesses.length === 1 ? businesses[0] : null;

    return {
      ctx: { ...ctx, user, business, businesses },
      args,
    };
  },
});

/**
 * 🔐 Authenticated Mutation: Requires login
 * Injects user + single business (if available)
 */
export const authenticatedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await tryGetAuthenticatedUser(ctx);
    if (!user) {
      throw new Error(
        "Authentication required. Please log in to perform this action."
      );
    }

    const businesses = await getUserBusinesses(ctx, user._id);
    const business = businesses.length === 1 ? businesses[0] : null;

    return {
      ctx: { ...ctx, user, business, businesses },
      args,
    };
  },
});

/**
 * 🟢 Optional Auth Query: Doesn't throw if not logged in
 * Includes user/business when available
 */
export const optionalAuthenticatedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await tryGetAuthenticatedUser(ctx); // 👈 Safe version

    let businesses: Doc<"businesses">[] = [];
    let business: Doc<"businesses"> | null = null;

    if (user) {
      businesses = await getUserBusinesses(ctx, user._id);
      business = businesses.length === 1 ? businesses[0] : null;
    }

    return { ctx: { ...ctx, user, business, businesses }, args };
  },
});

/**
 * 🟢 Optional Auth Mutation: Doesn't throw if not logged in
 * Includes user/business when available
 */
export const optionalAuthenticatedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await tryGetAuthenticatedUser(ctx); // 👈 Safe version

    let businesses: Doc<"businesses">[] = [];
    let business: Doc<"businesses"> | null = null;

    if (user) {
      businesses = await getUserBusinesses(ctx, user._id);
      business = businesses.length === 1 ? businesses[0] : null;
    }

    return { ctx: { ...ctx, user, business, businesses }, args };
  },
});

/**
 * 🧠 Enhanced Context Types
 */
export type AuthenticatedQueryCtx = QueryCtx & {
  user: Doc<"users">;
  business?: Doc<"businesses"> | null;
  businesses?: Doc<"businesses">[];
};

export type AuthenticatedMutationCtx = MutationCtx & {
  user: Doc<"users">;
  business?: Doc<"businesses"> | null;
  businesses?: Doc<"businesses">[];
};

export type OptionalAuthQueryCtx = QueryCtx & {
  user?: Doc<"users"> | null;
  business?: Doc<"businesses"> | null;
  businesses?: Doc<"businesses">[];
};

export type OptionalAuthMutationCtx = MutationCtx & {
  user?: Doc<"users"> | null;
  business?: Doc<"businesses"> | null;
  businesses?: Doc<"businesses">[];
};
