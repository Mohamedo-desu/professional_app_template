import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";

export const listCustomers = authenticatedQuery({
  args: {},
  handler: async ({ db, business }) => {
    if (!business) throw new Error("No active business found.");

    // 1️⃣ Get all business-customer links for this business
    const businessCustomers = await db
      .query("businessCustomers")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .collect();

    // 2️⃣ Fetch each linked customer
    const customers = (
      await Promise.all(
        businessCustomers.map(async (bc) => {
          const customer = await db.get(bc.customerId);
          return customer
            ? {
                ...customer,
                balance: bc.balance,
                joinedAt: bc.joinedAt,
              }
            : null;
        })
      )
    ).filter((c): c is NonNullable<typeof c> => c !== null);

    // 3️⃣ Return full list
    return customers;
  },
});
//
// 🧾 Add Customer Mutation
//
export const addCustomer = authenticatedMutation({
  args: {
    name: v.string(),
    phoneNumber: v.string(),
    emailAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { db, user, business } = ctx;

    if (!business) throw new Error("No active business found.");

    // 1️⃣ Create the customer
    const customerId = await db.insert("customers", {
      fullName: args.name,
      phoneNumber: args.phoneNumber,
      emailAddress: args.emailAddress ?? undefined,
    });

    // 2️⃣ Link the customer to this business
    await db.insert("businessCustomers", {
      businessId: business._id,
      customerId,
      balance: 0,
      joinedAt: Date.now(),
    });

    return { message: "Customer added successfully", customerId };
  },
});
