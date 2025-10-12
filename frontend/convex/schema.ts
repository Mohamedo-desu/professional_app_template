import { rateLimitTables } from "convex-helpers/server/rateLimit";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";
import { Id } from "./_generated/dataModel";

// =======================
// Existing app tables
// =======================

export const appVersions = defineTable({
  version: v.string(),
  type: v.union(v.literal("major"), v.literal("minor"), v.literal("patch")),
  releaseNotes: v.string(),
  downloadUrl: v.optional(v.string()),
});

export const users = defineTable({
  userName: v.string(),
  emailAddress: v.string(),
  clerkId: v.string(),
  imageUrl: v.optional(v.string()),
  isOnline: v.optional(v.boolean()),
  lastSeenAt: v.optional(v.number()),
  sessionId: v.optional(v.string()),
});

export const userCounts = defineTable({
  count: v.number(),
});

export const pushTokens = defineTable({
  userId: v.optional(v.id("users")),
  pushToken: v.string(),
  deviceId: v.string(),
  timestamp: v.string(),
});

export const notifications = defineTable({
  userId: v.id("users"),
  senderId: v.optional(v.id("users")),
  type: v.union(v.literal("account_warning"), v.literal("system")),
  title: v.string(),
  message: v.string(),
  entityId: v.optional(v.string()),
  entityType: v.optional(v.union(v.literal("post"), v.literal("comment"))),
  isRead: v.boolean(),
  readAt: v.optional(v.number()),
  metadata: v.optional(v.any()),
});

// =======================
// 🧾 SHOP MANAGEMENT TABLES
// =======================

// Items sold, debts, totals per day
export const dailyEntries = defineTable({
  date: v.string(),
  id: v.string(),
  sales: v.array(
    v.object({
      id: v.string(),
      title: v.string(),
      quantity: v.number(),
      price: v.number(),
      total: v.number(),
    })
  ),
  debts: v.array(
    v.object({
      id: v.string(),
      customerId: v.optional(v.string()),
      customerName: v.optional(v.string()),
      items: v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          quantity: v.number(),
          price: v.number(),
          total: v.number(),
        })
      ),
      totalOwed: v.number(),
    })
  ),
  closed: v.boolean(),
  totals: v.object({
    salesTotal: v.number(),
    debtsTotal: v.number(),
  }),
})
  .index("by_date", ["date"])
  .index("by_closed", ["closed"]);

// Each customer’s monthly record
export const customers = defineTable({
  name: v.string(),
  debts: v.array(
    v.object({
      id: v.string(),
      date: v.string(),
      items: v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          quantity: v.number(),
          price: v.number(),
          total: v.number(),
        })
      ),
      totalOwed: v.number(),
    })
  ),
  payments: v.array(
    v.object({
      id: v.string(),
      date: v.string(),
      amount: v.number(),
      note: v.optional(v.string()),
    })
  ),
  balance: v.number(),
})
  .index("by_name", ["name"])
  .index("by_balance", ["balance"]);

// =======================
// Final schema definition
// =======================
export default defineSchema({
  ...rateLimitTables,
  appVersions: appVersions
    .index("by_version", ["version"])
    .index("by_type", ["type"]),
  users: users
    .index("by_clerk_id", ["clerkId"])
    .index("by_user_name", ["userName"])
    .index("by_online_status", ["isOnline"])
    .index("by_last_seen", ["lastSeenAt"])
    .index("by_session", ["sessionId"]),
  userCounts: userCounts,
  pushTokens: pushTokens
    .index("by_user", ["userId"])
    .index("by_deviceId", ["deviceId"])
    .index("by_push_token", ["pushToken"]),
  notifications: notifications
    .index("by_user", ["userId"])
    .index("by_sender", ["senderId"])
    .index("by_type", ["type"])
    .index("by_read_status", ["isRead"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_entity", ["entityId", "entityType"]),
  dailyEntries: dailyEntries,
  customers: customers,
});

// =======================
// Type exports
// =======================
export type USER_TABLE = Infer<typeof users.validator> & {
  _id: Id<"users">;
  _creationTime: number;
};

export type NOTIFICATION_TABLE = Infer<typeof notifications.validator> & {
  _id: Id<"notifications">;
  _creationTime: number;
};

export type DAILY_ENTRY_TABLE = Infer<typeof dailyEntries.validator> & {
  _id: Id<"dailyEntries">;
  _creationTime: number;
};

export type CUSTOMER_TABLE = Infer<typeof customers.validator> & {
  _id: Id<"customers">;
  _creationTime: number;
};
