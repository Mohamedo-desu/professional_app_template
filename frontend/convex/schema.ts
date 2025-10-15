import { rateLimitTables } from "convex-helpers/server/rateLimit";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";
import { Id } from "./_generated/dataModel";

// =======================
// 📱 Core app tables
// =======================

export const appVersions = defineTable({
  version: v.string(), //1.0.0
  type: v.union(v.literal("major"), v.literal("minor"), v.literal("patch")),
  releaseNotes: v.string(),
  downloadUrl: v.optional(v.string()),
})
  .index("by_version", ["version"])
  .index("by_type", ["type"]);

export const users = defineTable({
  fullName: v.string(), // John Doe
  emailAddress: v.string(), // johndoe@gmail.com
  clerkId: v.string(), // user_dqa43d
  imageUrl: v.optional(v.string()), //svg
  businessIds: v.optional(v.array(v.id("businesses"))),
})
  .index("by_clerk_id", ["clerkId"])
  .index("by_user_name", ["fullName"]);

export const userCounts = defineTable({
  count: v.number(),
});

export const pushTokens = defineTable({
  userId: v.optional(v.id("users")),
  pushToken: v.string(),
  deviceId: v.string(),
  timestamp: v.string(),
})
  .index("by_user", ["userId"])
  .index("by_deviceId", ["deviceId"])
  .index("by_push_token", ["pushToken"]);

export const notifications = defineTable({
  businessId: v.optional(v.id("businesses")), // which business it belongs to
  userId: v.optional(v.id("users")), // recipient (optional for broadcast)
  type: v.union(
    v.literal("system"), // app/system notifications
    v.literal("stock_alert"), // low or out-of-stock alerts
    v.literal("payment_alert"), // payment confirmations (cash/mpesa)
    v.literal("debt_reminder"), // customer owes payment
    v.literal("daily_summary"), // end-of-day or profit summary
    v.literal("info") // general informational messages
  ),
  title: v.string(),
  message: v.string(),
  // Link to related entities (optional)
  entityId: v.optional(v.string()), // e.g. saleId, inventoryId, customerId
  entityType: v.optional(
    v.union(
      v.literal("sale"),
      v.literal("inventory"),
      v.literal("customer"),
      v.literal("debt"),
      v.literal("payment")
    )
  ),
  // Read tracking
  isRead: v.boolean(),
  readAt: v.optional(v.number()),
  // Additional details (e.g. {amount: 200, paymentMethod: "mpesa"})
  metadata: v.optional(v.any()),
})
  .index("by_user", ["userId"])
  .index("by_type", ["type"])
  .index("by_read_status", ["isRead"])
  .index("by_user_read", ["userId", "isRead"])
  .index("by_entity", ["entityId", "entityType"]);

// =======================
// 🏪 SHOP MANAGEMENT TABLES
// =======================

// 1️⃣ Businesses (tenants)
export const businesses = defineTable({
  name: v.string(), // Ugbaad Health & Cooking Shop
  ownerId: v.id("users"),
  location: v.optional(v.string()), // Eastleigh,Nairobi,Kenya
}).index("by_owner", ["ownerId"]);

// 2️⃣ Customers (global)
export const customers = defineTable({
  fullName: v.string(),
  phoneNumber: v.optional(v.string()),
  emailAddress: v.optional(v.string()),
})
  .index("by_name", ["fullName"])
  .index("by_phone", ["phoneNumber"]);

// 3️⃣ Business–Customer mapping (many-to-many)
export const businessCustomers = defineTable({
  businessId: v.id("businesses"),
  customerId: v.id("customers"),
  balance: v.number(), // current total owed for this business
  joinedAt: v.number(),
})
  .index("by_business", ["businessId"])
  .index("by_customer", ["customerId"])
  .index("by_business_customer", ["businessId", "customerId"]);

// 4️⃣ inventory (inventory for each business)
export const inventory = defineTable({
  businessId: v.id("businesses"),
  name: v.string(),
  quantityAvailable: v.number(),
  costPrice: v.number(),
  retailPrice: v.number(),
  wholesalePrice: v.optional(v.number()),
  unit: v.optional(v.string()),
  category: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  embedding: v.optional(v.array(v.float64())),
})
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
    filterFields: ["name"],
  })
  .index("by_business", ["businessId"])
  .index("by_name", ["businessId", "name"])
  .index("by_category", ["businessId", "category"]);

// 5️⃣ Daily entries (summary of one business day)
export const dailyEntries = defineTable({
  businessId: v.id("businesses"),
  date: v.float64(),
  closed: v.boolean(),
  cashTotal: v.number(),
  mpesaTotal: v.number(),
  salesTotal: v.number(),
  debtsTotal: v.number(),
  profitTotal: v.number(),
  closedAt: v.number(),
})
  .index("by_business", ["businessId"])
  .index("by_date", ["businessId", "date"])
  .index("by_closed", ["businessId", "closed"]);

// 6️⃣ Sales (each sale record)
export const sales = defineTable({
  businessId: v.id("businesses"),
  dailyEntryId: v.id("dailyEntries"),
  inventoryId: v.optional(v.id("inventory")),
  itemName: v.string(),
  quantitySold: v.number(),
  paymentMethod: v.union(
    v.literal("cash"),
    v.literal("mpesa"),
    v.literal("debt")
  ),
  totalAmount: v.number(),
  totalProfit: v.number(),
})
  .index("by_business", ["businessId"])
  .index("by_daily_entry", ["dailyEntryId"])
  .index("by_inventory", ["inventoryId"])
  .index("by_daily_entry_inventory", ["dailyEntryId", "inventoryId"])
  .index("by_daily_entry_inventory_payment", [
    "dailyEntryId",
    "inventoryId",
    "paymentMethod",
  ]);

// 7️⃣ Debts (per customer per business)
export const debts = defineTable({
  businessId: v.id("businesses"),
  customerId: v.id("customers"),
  date: v.float64(),
  saleId: v.optional(v.id("sales")),
  amountOwed: v.number(),
  amountPaid: v.number(),
  remainingBalance: v.number(),
  dueDate: v.optional(v.number()),
  status: v.optional(v.string()), // "pending", "paid"
  paid: v.number(),
  balance: v.number(),
})
  .index("by_business", ["businessId"])
  .index("by_customer", ["customerId"])
  .index("by_business_customer_status", ["businessId", "customerId", "status"])
  .index("by_date", ["businessId", "date"]);

// 8️⃣ Debt items
export const debtItems = defineTable({
  debtId: v.id("debts"),
  inventoryId: v.optional(v.id("inventory")),
  name: v.string(),
  quantityTaken: v.number(),
  price: v.number(),
  total: v.number(),
}).index("by_debt", ["debtId"]);

// 9️⃣ Payments
export const payments = defineTable({
  businessId: v.id("businesses"),
  customerId: v.id("customers"),
  amount: v.number(),
  method: v.union(v.literal("cash"), v.literal("mpesa")),
  mpesaCode: v.optional(v.string()),
  note: v.optional(v.string()),
  date: v.float64(),
})
  .index("by_business", ["businessId"])
  .index("by_customer", ["customerId"])
  .index("by_date", ["businessId", "date"]);

// =======================
// Final schema definition
// =======================
export default defineSchema({
  ...rateLimitTables,
  appVersions,
  users,
  userCounts,
  pushTokens,
  notifications,
  businesses,
  customers,
  businessCustomers,
  inventory,
  dailyEntries,
  sales,
  debts,
  debtItems,
  payments,
});

// =======================
// Type exports
// =======================
export type BUSINESS_TABLE = Infer<typeof businesses.validator> & {
  _id: Id<"businesses">;
  _creationTime: number;
};

export type CUSTOMER_TABLE = Infer<typeof customers.validator> & {
  _id: Id<"customers">;
  _creationTime: number;
};

export type BUSINESS_CUSTOMER_TABLE = Infer<
  typeof businessCustomers.validator
> & {
  _id: Id<"businessCustomers">;
  _creationTime: number;
};

export type STOCK_TABLE = Infer<typeof inventory.validator> & {
  _id: Id<"inventory">;
  _creationTime: number;
};

export type DAILY_ENTRY_TABLE = Infer<typeof dailyEntries.validator> & {
  _id: Id<"dailyEntries">;
  _creationTime: number;
};

export type SALE_TABLE = Infer<typeof sales.validator> & {
  _id: Id<"sales">;
  _creationTime: number;
};

export type DEBT_TABLE = Infer<typeof debts.validator> & {
  _id: Id<"debts">;
  _creationTime: number;
};

export type DEBT_ITEM_TABLE = Infer<typeof debtItems.validator> & {
  _id: Id<"debtItems">;
  _creationTime: number;
};

export type PAYMENT_TABLE = Infer<typeof payments.validator> & {
  _id: Id<"payments">;
  _creationTime: number;
};
