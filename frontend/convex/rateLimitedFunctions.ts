import {
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { ConvexError } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { checkRateLimit, rateLimit } from "./rateLimits";
import { tryGetAuthenticatedUser } from "./users";

/**
 * 🧩 Helper: Throws a consistent ConvexError for unauthenticated users
 */
function requireAuthError() {
  throw new ConvexError({
    code: "UNAUTHORIZED",
    message: "You must be logged in to perform this action.",
    hint: "Please sign in and try again.",
  });
}

/**
 * 🧩 Helper: Throws a consistent ConvexError for rate limit hits
 */
function rateLimitError(retryAt?: number) {
  throw new ConvexError({
    code: "RATE_LIMIT_EXCEEDED",
    message: "Rate limit exceeded. Please slow down your requests.",
    retryAt: retryAt ? new Date(retryAt).toISOString() : undefined,
  });
}

/**
 * 🔁 High-frequency (likes, interactions)
 */
export const rateLimitedAuthMutationHigh = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await tryGetAuthenticatedUser(ctx);
    if (!user) requireAuthError();

    return { ctx: { ...ctx, user }, args: {} };
  },
});

/**
 * 🗨️ Medium-frequency (posts, comments, replies)
 */
export const rateLimitedAuthMutationMedium = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await tryGetAuthenticatedUser(ctx);
    if (!user) requireAuthError();

    try {
      await rateLimit(ctx, {
        name: "createContent",
        key: user?._id,
        throws: true,
      });
    } catch (err: any) {
      rateLimitError(err?.retryAt);
    }

    return { ctx: { ...ctx, user }, args: {} };
  },
});

/**
 * 🧾 Low-frequency (reports, uploads)
 */
export const rateLimitedAuthMutationLow = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await tryGetAuthenticatedUser(ctx);
    if (!user) requireAuthError();

    try {
      await rateLimit(ctx, {
        name: "heavyAction",
        key: user?._id,
        throws: true,
      });
    } catch (err: any) {
      rateLimitError(err?.retryAt);
    }

    return { ctx: { ...ctx, user }, args: {} };
  },
});

/**
 * ⚙️ Account-level (profile updates, settings)
 */
export const rateLimitedAuthMutationAccount = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await tryGetAuthenticatedUser(ctx);
    if (!user) requireAuthError();

    try {
      await rateLimit(ctx, {
        name: "accountAction",
        key: user?._id,
        throws: true,
      });
    } catch (err: any) {
      rateLimitError(err?.retryAt);
    }

    return { ctx: { ...ctx, user }, args: {} };
  },
});

/**
 * 🔍 Optional auth query (pagination, browsing)
 */
export const rateLimitedOptionalAuthQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await tryGetAuthenticatedUser(ctx);
    const rateLimitKey = user?._id || "global";

    const { ok, retryAt } = await checkRateLimit(ctx, {
      name: "paginationQuery",
      key: rateLimitKey,
    });

    if (!ok) rateLimitError(retryAt);

    return { ctx: { ...ctx, user }, args: {} };
  },
});

/**
 * 🌍 Public query (global rate limiting)
 */
export const rateLimitedPublicQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await tryGetAuthenticatedUser(ctx);

    const { ok, retryAt } = await checkRateLimit(ctx, {
      name: "publicQuery",
      key: "global",
    });

    if (!ok) rateLimitError(retryAt);

    return { ctx: { ...ctx, user }, args: {} };
  },
});

/**
 * 🧱 Context types
 */
export type RateLimitedAuthMutationCtx = MutationCtx & {
  user: Doc<"users">;
};

export type RateLimitedOptionalAuthQueryCtx = QueryCtx & {
  user: Doc<"users"> | null;
};
