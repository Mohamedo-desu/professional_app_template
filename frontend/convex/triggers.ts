// convex/triggers.ts
import {
  customCtx,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { Triggers } from "convex-helpers/server/triggers";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import {
  internalMutation as rawInternalMutation,
  mutation as rawMutation,
} from "./_generated/server";

// Create triggers instance
const triggers = new Triggers<DataModel>();

/**
 * 🧹 USER CASCADE DELETE TRIGGER
 * Decrements user count and performs cleanup when a user is deleted.
 */
triggers.register("users", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const userId = change.id;
    console.log(`🧹 Starting cascade delete for user ${userId}`);

    try {
      const userCount = await ctx.db.query("userCounts").first();

      if (userCount) {
        await ctx.db.patch(userCount._id, {
          count: Math.max(0, userCount.count - 1),
        });
      }

      console.log(`✅ Cascade delete completed for user ${userId}`);
    } catch (err) {
      console.error(`❌ Failed cascade delete for user ${userId}:`, err);
      throw new ConvexError({
        code: "CASCADE_DELETE_FAILED",
        message: "Error occurred during cascade delete operation.",
        hint:
          err instanceof Error ? err.message : "Unknown error during cleanup.",
      });
    }
  }
});

/**
 * 🚀 APP VERSION TRIGGER
 * Broadcasts push notifications when a new app version is published.
 */
triggers.register("appVersions", async (ctx, change) => {
  if (change.operation === "update") {
    try {
      if (
        change.newDoc.downloadUrl === "https://drive.google.com/placeholder"
      ) {
        console.log("⏸️ Skipping placeholder update trigger.");
        return;
      }

      const version = change.newDoc;

      // Fetch all push tokens
      const tokens = await ctx.db.query("pushTokens").collect();
      if (tokens.length === 0) {
        console.log("ℹ️ No push tokens found, skipping version notification.");
        return;
      }

      const title = `🎉 Version ${version.version} Released!`;
      const body =
        version.releaseNotes ||
        "A new update is available. Check it out in the app!";
      const data = {
        version: version.version,
        type: version.type,
        downloadUrl: version.downloadUrl ?? null,
      };

      await ctx.scheduler.runAfter(0, internal.actions.sendToAllUsers, {
        body,
        title,
        data,
        tokens,
      });

      console.log(
        `📢 Broadcasted version ${version.version} to ${tokens.length} devices.`
      );
    } catch (err) {
      console.error("❌ Version trigger failed:", err);
      throw new ConvexError({
        code: "VERSION_NOTIFICATION_FAILED",
        message: "Failed to broadcast version update notifications.",
        hint: err instanceof Error ? err.message : "Unknown scheduler error.",
      });
    }
  }
});

// ✅ Export wrapped mutation helpers with triggers applied
export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
export const internalMutation = customMutation(
  rawInternalMutation,
  customCtx(triggers.wrapDB)
);

/**
 * 🧩 Manual Utility: Delete User Cascade
 * Safely deletes a user by Clerk ID.
 */
export const deleteUserCascade = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "USER_NOT_FOUND",
        message: `No user found for Clerk ID "${args.clerkId}".`,
        hint: "Ensure Clerk ID is valid before calling deleteUserCascade.",
      });
    }

    await ctx.db.delete(user._id);
    console.log(`🧽 Deleted user ${args.clerkId} and related records.`);
    return { success: true, message: "User deleted successfully." };
  },
});

/**
 * 🔗 Update version URL manually.
 * Used when the download URL needs to be updated after upload completes.
 */
export const updateVersionUrl = internalMutation({
  args: {
    url: v.string(),
    versionId: v.optional(v.id("appVersions")),
  },
  handler: async (ctx, args) => {
    let versionDocId = args.versionId;

    // 1️⃣ If versionId isn’t provided, get the latest version automatically
    if (!versionDocId) {
      const latest = await ctx.db.query("appVersions").order("desc").first();
      if (!latest) {
        throw new ConvexError({
          code: "NO_APP_VERSIONS",
          message: "No app versions found in the database.",
          hint: "Create an app version before attempting to update the URL.",
        });
      }
      versionDocId = latest._id;
    }

    // 2️⃣ Validate that version exists
    const version = await ctx.db.get(versionDocId);
    if (!version) {
      throw new ConvexError({
        code: "VERSION_NOT_FOUND",
        message: `App version not found for ID "${versionDocId}".`,
        hint: "The version may have been deleted or never created.",
      });
    }

    // 3️⃣ Perform the update
    await ctx.db.patch(versionDocId, { downloadUrl: args.url });

    console.log(`🔗 Updated download URL for version ${version.version}.`);
    return {
      success: true,
      code: "URL_UPDATED",
      message: "Download URL updated successfully.",
      versionId: versionDocId,
    };
  },
});

export default triggers;
