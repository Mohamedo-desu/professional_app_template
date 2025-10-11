import { ConvexError, v } from "convex/values";
import { optionalAuthMutation } from "./customFunctions";
import { rateLimitedOptionalAuthQuery } from "./rateLimitedFunctions";

/**
 * 🟢 Update user online status and activity timestamps
 * - Handles both online/offline transitions
 * - Skips DB writes if the status hasn't changed
 * - Safe for unauthenticated users (no-op)
 */
export const updateUserStatus = optionalAuthMutation({
  args: {
    status: v.union(v.literal("online"), v.literal("offline")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const isOnline = args.status === "online";

    // No authenticated user → no-op (don't throw to keep silent background updates smooth)
    if (!ctx.user) {
      return {
        success: false,
        code: "UNAUTHENTICATED",
        message: "No authenticated user. Skipped status update.",
        status: args.status,
        isOnline,
        timestamp: now,
      };
    }

    // Fetch current user
    const currentUser = await ctx.db.get(ctx.user._id);
    if (!currentUser) {
      throw new ConvexError({
        code: "USER_NOT_FOUND",
        message: "Authenticated user record not found.",
        hint: "User may have been deleted or not yet created in Convex.",
      });
    }

    // Only update when status changes (avoid unnecessary DB writes)
    if (currentUser.isOnline !== isOnline) {
      await ctx.db.patch(ctx.user._id, {
        isOnline,
        lastSeenAt: !isOnline ? now : currentUser.lastSeenAt,
      });
    }

    return {
      success: true,
      code: "STATUS_UPDATED",
      message: `User is now ${isOnline ? "online" : "offline"}.`,
      status: args.status,
      isOnline,
      timestamp: now,
    };
  },
});

/**
 * 🟣 Get a user's online status
 * - Rate limited for safety
 * - Returns null if user not found (no error)
 */
export const getUserOnlineStatus = rateLimitedOptionalAuthQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      // Instead of throwing, return a neutral response for frontend simplicity
      return {
        success: false,
        code: "USER_NOT_FOUND",
        message: `No user found with ID "${args.userId}".`,
        userId: args.userId,
        isOnline: false,
        lastSeenAt: null,
      };
    }

    return {
      success: true,
      code: "STATUS_OK",
      userId: args.userId,
      isOnline: !!user.isOnline,
      lastSeenAt: user.lastSeenAt,
    };
  },
});
