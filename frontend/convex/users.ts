import { ConvexError, v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";

/**
 * Creates a user record in the database if not already existing.
 */

export const todayKey = () => {
  const today = new Date();
  const todayKey = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  return todayKey;
};

export const createUser = internalMutation({
  args: {
    fullName: v.string(),
    emailAddress: v.string(),
    clerkId: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1️⃣ Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      throw new ConvexError({
        code: "USER_ALREADY_EXISTS",
        message: `A user with Clerk ID "${args.clerkId}" already exists.`,
        hint: "This may happen if the user re-registers with the same Clerk account.",
      });
    }

    // 2️⃣ Create user
    const userId = await ctx.db.insert("users", {
      fullName: args.fullName,
      emailAddress: args.emailAddress,
      clerkId: args.clerkId,
      imageUrl: args.imageUrl,
      businessIds: [],
    });

    // 3️⃣ Create default business for user
    const businessName = `${args.fullName.split(" ")[0]}'s Business`;

    const businessId = await ctx.db.insert("businesses", {
      ownerId: userId,
      name: businessName,
      location: "Nairobi,Kenya",
    });

    // 4️⃣ Update user's businessIds to include the new business
    await ctx.db.patch(userId, {
      businessIds: [businessId],
    });

    // 4️⃣ Optionally, create first "daily entry" for today

    await ctx.db.insert("dailyEntries", {
      businessId,
      date: todayKey(),
      closed: false,
      cashTotal: 0,
      mpesaTotal: 0,
      salesTotal: 0,
      debtsTotal: 0,
      profitTotal: 0,
      closedAt: 0,
    });

    // 5️⃣ Send system notification (optional)
    await ctx.db.insert("notifications", {
      businessId,
      userId,
      type: "system",
      title: "Business Initialized",
      message: `Welcome ${args.fullName}! Your business "${businessName}" has been created automatically.`,
      isRead: false,
    });

    return {
      success: true,
      message: "User and business created successfully.",
      userId,
      businessId,
    };
  },
});

/**
 * 🟢 Safe version of getAuthenticatedUser
 * Returns `null` instead of throwing when unauthenticated.
 */
export const tryGetAuthenticatedUser = async (ctx: QueryCtx | MutationCtx) => {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return currentUser ?? null;
  } catch (err) {
    // Ignore ConvexError or missing identity cases
    return null;
  }
};

/**
 * Retrieves a user by their Clerk ID.
 */
export const getUserByClerkId = query({
  args: { clerkId: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    if (!args.clerkId) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Clerk ID cannot be null or undefined.",
        hint: "Provide a valid Clerk ID when querying a user.",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId!))
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "USER_NOT_FOUND",
        message: `No user found with Clerk ID "${args.clerkId}".`,
      });
    }

    return user;
  },
});

/**
 * Deletes a Clerk user account remotely through Clerk API.
 */
export const initiateAccountDeletion = action({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be signed in to delete your account.",
      });
    }

    const clerkId = identity.subject;
    const CLERK_API_KEY = process.env.CLERK_API_KEY;

    if (!CLERK_API_KEY) {
      throw new ConvexError({
        code: "CONFIG_ERROR",
        message: "Clerk API key is not configured.",
        hint: "Set CLERK_API_KEY in your Convex environment variables.",
      });
    }

    try {
      const response = await fetch(
        `https://api.clerk.com/v1/users/${clerkId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${CLERK_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Clerk API error:", errorData);
        throw new ConvexError({
          code: "CLERK_API_ERROR",
          message: `Failed to delete Clerk user (status ${response.status}).`,
          hint: errorData,
        });
      }

      console.log(`Successfully deleted Clerk user: ${clerkId}`);
      return { success: true };
    } catch (error) {
      console.error("Error deleting user account:", error);
      throw new ConvexError({
        code: "DELETE_FAILED",
        message: "An error occurred while deleting your account.",
        hint: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

/**
 * Returns user count (internal use).
 */
export const getCount = internalQuery(async (ctx) => {
  const doc = await ctx.db.query("userCounts").first();
  return doc ?? { count: 0 };
});

/**
 * Increments user count (internal use).
 */
export const increment = internalMutation(async (ctx) => {
  const doc = await ctx.db.query("userCounts").first();
  if (doc) {
    await ctx.db.patch(doc._id, { count: doc.count + 1 });
  } else {
    await ctx.db.insert("userCounts", { count: 1 });
  }
});

/**
 * Retrieves a user by their database ID.
 */
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError({
        code: "USER_NOT_FOUND",
        message: `No user found with ID "${userId}".`,
      });
    }

    // Omit sensitive fields before returning
    const { emailAddress, clerkId, ...publicUser } = user;
    return publicUser;
  },
});
