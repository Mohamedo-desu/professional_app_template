import { ConvexError, v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { todayKey } from "./users";

/**
 * 📅 Get today's daily entry for the current business
 */
export const getTodayDailyEntry = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    if (!ctx.user || !ctx.business) {
      return null;
    }

    return await ctx.db
      .query("dailyEntries")
      .withIndex("by_date", (q) =>
        q.eq("businessId", ctx.business!._id).eq("date", todayKey())
      )
      .unique();
  },
});
/**
 * 🏁 Start a new business day
 * - Closes any previous open entry
 * - Creates a fresh daily entry for today
 * - Sends a system notification
 */
export const startNewDay = authenticatedMutation({
  args: {},
  handler: async (ctx) => {
    if (!ctx.business)
      throw new ConvexError("No active business found for this user.");
    const businessId = ctx.business!._id;

    // 3️⃣ Check if entry for today already exists
    const existing = await ctx.db
      .query("dailyEntries")
      .withIndex("by_date", (q) =>
        q.eq("businessId", businessId).eq("date", todayKey())
      )
      .unique();

    if (existing) {
      console.log({ existing });

      return existing._id; // already started
    }

    // 4️⃣ Create a new entry
    const entryId = await ctx.db.insert("dailyEntries", {
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

    // 5️⃣ Send system notification
    await ctx.db.insert("notifications", {
      businessId,
      userId: ctx.user._id,
      type: "system",
      title: "New Business Day Started",
      message: `A new business day has been initialized on ${new Date().toDateString()}.`,
      isRead: false,
    });

    return entryId;
  },
});
/**
 * ✅ Close daily entry (end of day) and update totals
 */
export const closeEntry = authenticatedMutation({
  args: {
    entryId: v.id("dailyEntries"),
  },
  handler: async (ctx, { entryId }) => {
    const entry = await ctx.db.get(entryId);
    if (!entry) throw new ConvexError("Daily entry not found.");
    if (entry.businessId !== ctx.business?._id)
      throw new ConvexError(
        "Unauthorized: entry does not belong to your business."
      );

    if (entry.closed) throw new ConvexError("Entry already closed.");

    // 🧮 1️⃣ Fetch all sales linked to this entry
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_daily_entry", (q) => q.eq("dailyEntryId", entryId))
      .collect();

    // 🧾 2️⃣ Compute totals (exclude debts from paid totals)
    let cashTotal = 0;
    let mpesaTotal = 0;
    let salesTotal = 0;
    let profitTotal = 0;
    let debtsTotal = 0;

    for (const sale of sales) {
      const amount = sale.totalAmount || 0;
      const profit = sale.totalProfit || 0;

      if (sale.paymentMethod === "cash") {
        cashTotal += amount;
        salesTotal += amount;
        profitTotal += profit;
      } else if (sale.paymentMethod === "mpesa") {
        mpesaTotal += amount;
        salesTotal += amount;
        profitTotal += profit;
      } else if (sale.paymentMethod === "debt") {
        // 💰 Track debts separately
        debtsTotal += amount;
      }
    }

    // 🧩 3️⃣ Patch entry with recalculated totals
    await ctx.db.patch(entryId, {
      closed: true,
      closedAt: Date.now(),
      cashTotal,
      mpesaTotal,
      salesTotal,
      profitTotal,
      debtsTotal,
    });

    // 🔔 4️⃣ Send notification summary
    await ctx.db.insert("notifications", {
      businessId: ctx.business!._id,
      userId: ctx.user._id,
      type: "daily_summary",
      title: "Day Closed Successfully",
      message: `Business day closed on ${new Date(entry.date).toDateString()}.`,
      isRead: false,
      metadata: {
        totals: { cashTotal, mpesaTotal, salesTotal, profitTotal, debtsTotal },
      },
    });

    return {
      success: true,
      message:
        "Daily entry closed successfully. Debt sales included separately.",
    };
  },
});

export const reopenEntry = authenticatedMutation({
  args: {
    entryId: v.id("dailyEntries"),
  },
  handler: async (ctx, { entryId }) => {
    if (!ctx.business)
      throw new Error("No active business found for this user.");

    // 1️⃣ Fetch the entry
    const entry = await ctx.db.get(entryId);
    if (!entry) throw new Error("Daily entry not found.");

    // 2️⃣ Check ownership
    if (entry.businessId !== ctx.business!._id) {
      throw new Error("Unauthorized: entry does not belong to your business.");
    }

    // 3️⃣ Ensure it’s actually closed
    if (!entry.closed) {
      throw new Error("Entry is already open.");
    }

    // 4️⃣ Reopen the entry
    await ctx.db.patch(entryId, {
      closed: false,
      closedAt: 0,
    });

    // 5️⃣ Optional: send system notification
    await ctx.db.insert("notifications", {
      businessId: ctx.business!._id,
      userId: ctx.user._id,
      type: "system",
      title: "Daily Entry Reopened",
      message: `The daily entry for ${new Date(entry.date).toDateString()} has been reopened.`,
      isRead: false,
    });

    return { success: true, message: "Daily entry reopened successfully." };
  },
});

export const getSalesByDailyEntry = authenticatedQuery({
  args: {
    dailyEntryId: v.optional(v.id("dailyEntries")),
  },
  handler: async (ctx, { dailyEntryId }) => {
    if (!ctx.user || !ctx.business || !dailyEntryId) {
      // No business or no dailyEntryId passed — return empty safely
      return [];
    }

    return await ctx.db
      .query("sales")
      .withIndex("by_daily_entry", (q) => q.eq("dailyEntryId", dailyEntryId))
      .order("desc")
      .collect();
  },
});

/**
 * 📦 Fetch all inventory items for the current business
 */
export const fetchInventory = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    if (!ctx.business)
      throw new ConvexError("No active business found for this user.");

    return await ctx.db
      .query("inventory")
      .withIndex("by_business", (q) => q.eq("businessId", ctx.business!._id))
      .order("desc")
      .collect();
  },
});
/**
 * 💰 Add a sale for today's entry
 */
export const addSaleForToday = authenticatedMutation({
  args: {
    inventoryId: v.id("inventory"),
    quantity: v.number(),
    paymentMethod: v.union(
      v.literal("cash"),
      v.literal("mpesa"),
      v.literal("debt")
    ),
    customerId: v.optional(v.id("customers")),
  },
  handler: async (
    ctx,
    { inventoryId, quantity, paymentMethod, customerId }
  ) => {
    if (!ctx.business)
      throw new ConvexError("No active business found for this user.");

    const item = await ctx.db.get(inventoryId);
    if (!item) throw new ConvexError("Inventory item not found.");

    if (quantity > item.quantityAvailable)
      throw new ConvexError("Insufficient stock available.");

    // 🔹 Find or create today's daily entry
    let dailyEntry = await ctx.db
      .query("dailyEntries")
      .withIndex("by_date", (q) =>
        q.eq("businessId", ctx.business!._id).eq("date", todayKey())
      )
      .unique();

    if (!dailyEntry) {
      const entryId = await ctx.db.insert("dailyEntries", {
        businessId: ctx.business!._id,
        date: todayKey(),
        closed: false,
        cashTotal: 0,
        mpesaTotal: 0,
        salesTotal: 0,
        debtsTotal: 0,
        profitTotal: 0,
        closedAt: 0,
      });
      dailyEntry = (await ctx.db.get(entryId))!;
    }

    const totalAmountDelta = item.retailPrice * quantity;
    const totalProfitDelta = (item.retailPrice - item.costPrice) * quantity;

    let existingSale: any = null;

    // ✅ For all payment methods (including debt), we can reuse same-day same-item sales
    existingSale = await ctx.db
      .query("sales")
      .withIndex("by_daily_entry_inventory_payment", (q) =>
        q
          .eq("dailyEntryId", dailyEntry._id)
          .eq("inventoryId", inventoryId)
          .eq("paymentMethod", paymentMethod)
      )
      .first();

    if (existingSale) {
      // 🔹 Update existing sale
      await ctx.db.patch(existingSale._id, {
        quantitySold: existingSale.quantitySold + quantity,
        totalAmount: existingSale.totalAmount + totalAmountDelta,
        totalProfit: existingSale.totalProfit + totalProfitDelta,
      });
    } else {
      // 🔹 Insert new sale
      const newSaleId = await ctx.db.insert("sales", {
        businessId: ctx.business!._id,
        dailyEntryId: dailyEntry._id,
        inventoryId,
        itemName: item.name,
        quantitySold: quantity,
        paymentMethod, // ✅ record real payment method, including "debt"
        totalAmount: totalAmountDelta,
        totalProfit: totalProfitDelta,
      });
      existingSale = await ctx.db.get(newSaleId);
    }

    // 🔹 Update inventory stock
    await ctx.db.patch(inventoryId, {
      quantityAvailable: item.quantityAvailable - quantity,
    });

    // ✅ Handle debt sales
    if (paymentMethod === "debt") {
      if (!customerId)
        throw new ConvexError("Customer must be selected for debt sales.");

      // 🔹 Check if the customer already has an existing unpaid debt
      let existingDebt = await ctx.db
        .query("debts")
        .withIndex("by_business_customer_status", (q) =>
          q
            .eq("businessId", ctx.business!._id)
            .eq("customerId", customerId)
            .eq("status", "pending")
        )
        .first();

      if (existingDebt) {
        // 🧾 Update existing debt totals
        await ctx.db.patch(existingDebt._id, {
          amountOwed: existingDebt.amountOwed + totalAmountDelta,
          remainingBalance: existingDebt.remainingBalance + totalAmountDelta,
          balance: existingDebt.balance + totalAmountDelta,
        });

        // ➕ Add new debt item
        await ctx.db.insert("debtItems", {
          debtId: existingDebt._id,
          inventoryId,
          name: item.name,
          quantityTaken: quantity,
          price: item.retailPrice,
          total: totalAmountDelta,
        });
      } else {
        // 🆕 Create a new debt record
        const debtId = await ctx.db.insert("debts", {
          businessId: ctx.business!._id,
          customerId,
          date: Date.now(),
          saleId: existingSale._id,
          amountOwed: totalAmountDelta,
          amountPaid: 0,
          remainingBalance: totalAmountDelta,
          paid: 0,
          balance: totalAmountDelta,
          status: "pending",
        });

        await ctx.db.insert("debtItems", {
          debtId,
          inventoryId,
          name: item.name,
          quantityTaken: quantity,
          price: item.retailPrice,
          total: totalAmountDelta,
        });
      }

      // 🧾 Update daily debt total
      await ctx.db.patch(dailyEntry._id, {
        debtsTotal: dailyEntry.debtsTotal + totalAmountDelta,
      });

      // 🧾 Update business-customer link balance
      const existingLink = await ctx.db
        .query("businessCustomers")
        .withIndex("by_business_customer", (q) =>
          q.eq("businessId", ctx.business!._id).eq("customerId", customerId)
        )
        .unique();

      if (existingLink) {
        await ctx.db.patch(existingLink._id, {
          balance: existingLink.balance + totalAmountDelta,
        });
      }

      // 🧾 Send notification
      await ctx.db.insert("notifications", {
        businessId: ctx.business!._id,
        userId: ctx.user._id,
        type: "debt_reminder",
        title: existingDebt
          ? "Existing Customer Debt Updated"
          : "New Customer Debt Created",
        message: `${item.name} (${quantity}x) recorded as debt for customer.`,
        entityId: existingDebt?._id ?? existingSale._id,
        entityType: "debt",
        isRead: false,
        metadata: { inventoryId, quantity, amount: totalAmountDelta },
      });
    } else {
      // ✅ Normal sale totals
      const cashDelta = paymentMethod === "cash" ? totalAmountDelta : 0;
      const mpesaDelta = paymentMethod === "mpesa" ? totalAmountDelta : 0;

      await ctx.db.patch(dailyEntry._id, {
        cashTotal: dailyEntry.cashTotal + cashDelta,
        mpesaTotal: dailyEntry.mpesaTotal + mpesaDelta,
        salesTotal: dailyEntry.salesTotal + totalAmountDelta,
        profitTotal: dailyEntry.profitTotal + totalProfitDelta,
      });

      await ctx.db.insert("notifications", {
        businessId: ctx.business!._id,
        userId: ctx.user._id,
        type: "payment_alert",
        title: "Sale Updated",
        message: `${quantity} x ${item.name} sold for ${totalAmountDelta} (${paymentMethod})`,
        entityId: existingSale._id,
        entityType: "sale",
        isRead: false,
        metadata: {
          inventoryId,
          quantity,
          amount: totalAmountDelta,
          paymentMethod,
        },
      });
    }

    return { success: true, message: "Sale added or updated successfully." };
  },
});

/**
 * ❌ Delete a sale entirely
 * - Adjusts inventory and daily entry totals accordingly
 */
export const deleteSale = authenticatedMutation({
  args: {
    saleId: v.id("sales"),
  },
  handler: async (ctx, { saleId }) => {
    // ✅ Fetch sale
    const sale = await ctx.db.get(saleId);
    if (!sale) throw new ConvexError("Sale not found.");

    // ✅ Check business ownership
    if (!ctx.business || sale.businessId !== ctx.business!._id) {
      throw new ConvexError("Unauthorized access.");
    }

    // ✅ Fetch related inventory
    const inventory = sale.inventoryId
      ? await ctx.db.get(sale.inventoryId)
      : null;

    // ✅ Fetch related daily entry
    const dailyEntry = await ctx.db.get(sale.dailyEntryId);
    if (!dailyEntry) throw new ConvexError("Daily entry not found.");

    // ✅ Return sale quantity to inventory
    if (inventory) {
      await ctx.db.patch(inventory._id, {
        quantityAvailable:
          (inventory.quantityAvailable ?? 0) + sale.quantitySold,
      });
    }

    // ✅ Update daily entry totals
    const cashDelta = sale.paymentMethod === "cash" ? sale.totalAmount : 0;
    const mpesaDelta = sale.paymentMethod === "mpesa" ? sale.totalAmount : 0;

    await ctx.db.patch(dailyEntry._id, {
      cashTotal: (dailyEntry.cashTotal ?? 0) - cashDelta,
      mpesaTotal: (dailyEntry.mpesaTotal ?? 0) - mpesaDelta,
      salesTotal: (dailyEntry.salesTotal ?? 0) - sale.totalAmount,
      profitTotal: (dailyEntry.profitTotal ?? 0) - sale.totalProfit,
    });

    // ✅ Delete the sale
    await ctx.db.delete(saleId);

    return { success: true, message: "Sale deleted successfully." };
  },
});

/**
 * ➕ Add new item to inventory
 */
export const addItemToInventory = authenticatedMutation({
  args: {
    name: v.string(),
    costPrice: v.number(),
    retailPrice: v.number(),
    quantityAvailable: v.number(),
    wholesalePrice: v.optional(v.number()),
    unit: v.optional(v.string()),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (
    ctx,
    {
      name,
      costPrice,
      retailPrice,
      quantityAvailable,
      wholesalePrice,
      unit,
      category,
      imageUrl,
    }
  ) => {
    if (!ctx.business)
      throw new ConvexError("No active business found for this user.");

    const businessId = ctx.business!._id;

    // ✅ Prevent duplicate items (case-insensitive)
    const existingItem = await ctx.db
      .query("inventory")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.eq(q.field("name"), name.trim().toLowerCase()))
      .first();

    if (existingItem) {
      throw new ConvexError(`Item "${name}" already exists in inventory.`);
    }

    // 🏗️ Insert new inventory item
    const newItemId = await ctx.db.insert("inventory", {
      businessId,
      name: name.trim().toLowerCase(),
      costPrice,
      retailPrice,
      quantityAvailable,
      wholesalePrice: wholesalePrice ?? undefined,
      unit: unit ?? "pcs",
      category: category ?? "Uncategorized",
      imageUrl:
        imageUrl ??
        "https://via.placeholder.com/300x300.png?text=Product+Image",
    });

    // 🔔 Send system notification
    await ctx.db.insert("notifications", {
      businessId,
      userId: ctx.user._id,
      type: "stock_alert",
      title: "New Inventory Item Added",
      message: `Added ${quantityAvailable} units of "${name}" to inventory.`,
      entityId: newItemId,
      entityType: "inventory",
      isRead: false,
      metadata: {
        name,
        costPrice,
        retailPrice,
        quantityAvailable,
        category,
      },
    });

    return { success: true, message: `"${name}" added to inventory.` };
  },
});
