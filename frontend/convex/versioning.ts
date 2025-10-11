import { ConvexError, v } from "convex/values";
import { internalQuery, query } from "./_generated/server";
import { internalMutation } from "./triggers";

export const createVersion = internalMutation({
  args: {
    version: v.string(),
    type: v.union(v.literal("major"), v.literal("minor"), v.literal("patch")),
    releaseNotes: v.string(),
    downloadUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("appVersions")
      .withIndex("by_version", (q) => q.eq("version", args.version))
      .first();

    if (existing) {
      throw new ConvexError({
        code: "VERSION_EXISTS",
        message: `Version "${args.version}" already exists.`,
        hint: "Use a different version number or delete the existing one first.",
      });
    }

    await ctx.db.insert("appVersions", {
      version: args.version,
      type: args.type,
      releaseNotes: args.releaseNotes,
      downloadUrl: args.downloadUrl,
    });

    return { success: true, message: "Version created successfully." };
  },
});

export const getLatestVersion = internalQuery({
  handler: async (ctx) => {
    const latest = await ctx.db.query("appVersions").order("desc").first();

    if (!latest) {
      throw new ConvexError({
        code: "NO_VERSIONS",
        message: "No app versions found.",
        hint: "Create a version first using the admin panel or API.",
      });
    }

    return {
      version: latest.version,
      downloadUrl: latest.downloadUrl,
      type: latest.type,
      releaseNotes: latest.releaseNotes,
    };
  },
});

export const getLatestVersionFrontend = query({
  handler: async (ctx) => {
    const latest = await ctx.db.query("appVersions").order("desc").first();

    if (!latest) {
      throw new ConvexError({
        code: "NO_VERSIONS",
        message: "No app versions found.",
        hint: "Please check again later — a new version will be released soon.",
      });
    }

    return {
      version: latest.version,
      downloadUrl: latest.downloadUrl,
      type: latest.type,
      releaseNotes: latest.releaseNotes,
    };
  },
});

export const deleteVersion = internalMutation({
  args: { version: v.string() },
  handler: async (ctx, { version }) => {
    const existing = await ctx.db
      .query("appVersions")
      .withIndex("by_version", (q) => q.eq("version", version))
      .first();

    if (!existing) {
      throw new ConvexError({
        code: "VERSION_NOT_FOUND",
        message: `Version "${version}" not found.`,
        hint: "Make sure the version exists before attempting to delete.",
      });
    }

    await ctx.db.delete(existing._id);

    return {
      success: true,
      message: `Version "${version}" deleted successfully.`,
    };
  },
});
