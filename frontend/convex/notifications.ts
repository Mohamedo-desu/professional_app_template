import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const registerPushToken = mutation({
  args: {
    pushToken: v.string(),
    deviceId: v.string(), // Only deviceId for consistency
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    const { pushToken, deviceId, timestamp } = args;
    const authenticatedUser = await getAuthenticatedUser(ctx);

    // Validate required fields
    if (!pushToken || !deviceId) {
      return {
        success: false,
        message: "Missing required fields: pushToken or deviceId",
      };
    }

    // Check if a push token with this deviceId already exists
    const existingToken = await ctx.db
      .query("pushTokens")
      .filter((q) => q.eq(q.field("deviceId"), deviceId))
      .first();

    let pushTokenEntry;
    let message;

    if (existingToken) {
      // Update the existing push token
      await ctx.db.patch(existingToken._id, {
        userId: authenticatedUser?._id,
        pushToken,
        deviceId,
        timestamp,
      });
      pushTokenEntry = existingToken._id;
      message = "Push token updated successfully";
    } else {
      // Create a new push token entry
      pushTokenEntry = await ctx.db.insert("pushTokens", {
        userId: authenticatedUser?._id,
        pushToken,
        deviceId,
        timestamp,
      });
      message = "Push token registered successfully";
    }

    return {
      success: true,
      message,
      tokenId: pushTokenEntry,
      userId: authenticatedUser?._id,
    };
  },
});
export const unregisterPushToken = mutation({
  args: {
    deviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const { deviceId } = args;

    if (!deviceId) {
      return { success: false, message: "Missing deviceId" };
    }

    // Find any tokens for this device and delete them
    const tokens = await ctx.db
      .query("pushTokens")
      .filter((q) => q.eq(q.field("deviceId"), deviceId))
      .collect();

    for (const token of tokens) {
      await ctx.db.delete(token._id);
    }

    return { success: true, message: "Push token(s) unregistered" };
  },
});
export const getUserPushTokens = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
export const removePushToken = internalMutation({
  args: {
    pushTokenId: v.id("pushTokens"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.pushTokenId);
  },
});
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    senderId: v.optional(v.id("users")),
    type: v.union(v.literal("account_warning"), v.literal("system")),
    title: v.string(),
    message: v.string(),
    entityId: v.optional(v.string()),
    entityType: v.optional(v.union(v.literal("post"), v.literal("comment"))),
    metadata: v.optional(v.any()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; message: string; result?: any }> => {
    try {
      // Don't create notification if user is trying to notify themselves
      if (args.senderId && args.userId === args.senderId) {
        return {
          success: false,
          message: `can not send notification to your self`,
        };
      }

      // Create in-app notification
      const notificationId = await ctx.db.insert("notifications", {
        userId: args.userId,
        senderId: args.senderId,
        type: args.type,
        title: args.title,
        message: args.message,
        entityId: args.entityId,
        entityType: args.entityType,
        isRead: false,
        metadata: args.metadata,
      });

      // Get all push tokens for this user
      const pushTokens: Doc<"pushTokens">[] = await ctx.runQuery(
        internal.notifications.getUserPushTokens,
        {
          userId: args.userId,
        }
      );

      if (pushTokens.length === 0) {
        return { success: false, message: "No push tokens found" };
      }

      // Prepare push notification payload
      const messages = pushTokens.map((tokenDoc: Doc<"pushTokens">) => ({
        to: tokenDoc.pushToken,
        sound: "default",
        title: args.title,
        body: args.message,
        data: {
          notificationId: notificationId,
          type: args.type,
          entityId: args.entityId,
          entityType: args.entityType,
          ...args.metadata,
        },
        priority: "high",
        channelId: "default",
      }));

      // Send push notifications via Expo's push service
      const response: Response = await fetch(
        "https://exp.host/--/api/v2/push/send",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messages),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Push notification failed:", errorText);
        return {
          success: false,
          message: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const result = await response.json();

      // Handle any invalid tokens by removing them
      if (Array.isArray(result.data)) {
        for (let i = 0; i < result.data.length; i++) {
          const ticketResult = result.data[i];
          if (
            ticketResult.status === "error" &&
            (ticketResult.details?.error === "DeviceNotRegistered" ||
              ticketResult.details?.error === "InvalidCredentials")
          ) {
            // Remove invalid push token
            await ctx.runMutation(internal.notifications.removePushToken, {
              pushTokenId: pushTokens[i]._id,
            });
          }
        }
      }

      return {
        success: true,
        message: `Sent to ${messages.length} devices`,
        result,
      };
    } catch (error) {
      console.error("Error sending push notification:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
export const getUserNotificationsUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return 0;
    }

    const unreadCount = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    return unreadCount.length;
  },
});
export const getUserNotifications = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const result = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    // Enrich notifications with sender information
    const enrichedNotifications = await Promise.all(
      result.page.map(async (notification) => {
        let sender = null;
        if (notification.senderId) {
          sender = await ctx.db.get(notification.senderId);
        }

        return {
          ...notification,
          sender: sender
            ? {
                _id: sender._id,
                userName: sender.userName,
                imageUrl: sender.imageUrl,
              }
            : null,
        };
      })
    );

    return {
      ...result,
      page: enrichedNotifications,
      continueCursor: result.continueCursor || "",
    };
  },
});
export const markUserNotificationAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Verify the notification belongs to the current user
    if (notification.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });
  },
});
export const markAllUserNotificationAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    const updatePromises = unreadNotifications.map((notification) =>
      ctx.db.patch(notification._id, {
        isRead: true,
        readAt: Date.now(),
      })
    );

    await Promise.all(updatePromises);

    return unreadNotifications.length;
  },
});
export const deleteUserNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Verify the notification belongs to the current user
    if (notification.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.notificationId);
  },
});
