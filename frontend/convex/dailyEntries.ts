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
    const businessId = ctx.business._id;

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

    // 🧮 1. Fetch all sales linked to this entry
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_daily_entry", (q) => q.eq("dailyEntryId", entryId))
      .collect();

    // 🧾 2. Compute totals by payment type
    let cashTotal = 0;
    let mpesaTotal = 0;
    let salesTotal = 0;
    let profitTotal = 0;

    for (const sale of sales) {
      const amount = sale.totalAmount || 0;
      const profit = sale.totalProfit || 0;

      salesTotal += amount;
      profitTotal += profit;

      if (sale.paymentMethod === "cash") {
        cashTotal += amount;
      } else if (sale.paymentMethod === "mpesa") {
        mpesaTotal += amount;
      }
    }

    // 🧩 3. Patch the entry with recalculated values
    await ctx.db.patch(entryId, {
      closed: true,
      closedAt: Date.now(),
      cashTotal,
      mpesaTotal,
      salesTotal,
      profitTotal,
    });

    // 🔔 4. Optional: Send a notification with end-of-day summary
    await ctx.db.insert("notifications", {
      businessId: ctx.business._id,
      userId: ctx.user._id,
      type: "daily_summary",
      title: "Day Closed Successfully",
      message: `Business day closed on ${new Date(entry.date).toDateString()}.`,
      isRead: false,
      metadata: {
        totals: { cashTotal, mpesaTotal, salesTotal, profitTotal },
      },
    });
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
    if (entry.businessId !== ctx.business._id) {
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
      businessId: ctx.business._id,
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
    paymentMethod: v.union(v.literal("cash"), v.literal("mpesa")),
  },
  handler: async (ctx, { inventoryId, quantity, paymentMethod }) => {
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
        businessId: ctx.business._id,
        date: todayKey(),
        closed: false,
        cashTotal: 0,
        mpesaTotal: 0,
        salesTotal: 0,
        debtsTotal: 0,
        profitTotal: 0,
        closedAt: 0,
      });

      const newEntry = await ctx.db.get(entryId);
      if (!newEntry) throw new ConvexError("Failed to create daily entry.");
      dailyEntry = newEntry;
    }

    // 🔹 Check if a sale for this inventory already exists today
    let existingSale = await ctx.db
      .query("sales")
      .withIndex("by_daily_entry_inventory", (q) =>
        q.eq("dailyEntryId", dailyEntry._id).eq("inventoryId", inventoryId)
      )
      .first();

    const totalAmountDelta = item.retailPrice * quantity;
    const totalProfitDelta = (item.retailPrice - item.costPrice) * quantity;

    if (existingSale) {
      // 🔹 Update existing sale
      await ctx.db.patch(existingSale._id, {
        quantitySold: existingSale.quantitySold + quantity,
        totalAmount: existingSale.totalAmount + totalAmountDelta,
        totalProfit: existingSale.totalProfit + totalProfitDelta,
      });
    } else {
      // 🔹 Insert new sale and fetch the full object
      const newSaleId = await ctx.db.insert("sales", {
        businessId: ctx.business._id,
        dailyEntryId: dailyEntry._id,
        inventoryId,
        itemName: item.name,
        quantitySold: quantity,
        paymentMethod,
        totalAmount: totalAmountDelta,
        totalProfit: totalProfitDelta,
      });

      const newSale = await ctx.db.get(newSaleId);
      if (!newSale) throw new ConvexError("Failed to create sale.");
      existingSale = newSale;
    }

    // 🔹 Update inventory stock
    await ctx.db.patch(inventoryId, {
      quantityAvailable: item.quantityAvailable - quantity,
    });

    // 🔹 Update daily entry totals
    const cashDelta = paymentMethod === "cash" ? totalAmountDelta : 0;
    const mpesaDelta = paymentMethod === "mpesa" ? totalAmountDelta : 0;

    await ctx.db.patch(dailyEntry._id, {
      cashTotal: dailyEntry.cashTotal + cashDelta,
      mpesaTotal: dailyEntry.mpesaTotal + mpesaDelta,
      salesTotal: dailyEntry.salesTotal + totalAmountDelta,
      profitTotal: dailyEntry.profitTotal + totalProfitDelta,
    });

    // 🔹 Create notification
    await ctx.db.insert("notifications", {
      businessId: ctx.business._id,
      userId: ctx.user._id,
      type: "payment_alert",
      title: "Sale Updated",
      message: `${quantity} x ${item.name} sold for ${totalAmountDelta} (${paymentMethod})`,
      entityId: existingSale._id, // safe now
      entityType: "sale",
      isRead: false,
      metadata: {
        inventoryId,
        quantity,
        amount: totalAmountDelta,
        paymentMethod,
      },
    });

    return { success: true, message: "Sale added/updated successfully." };
  },
});

/**
 * ➖ Decrement sale quantity
 * - Updates the sale quantity
 * - Adjusts totalAmount, totalProfit, inventory, and daily entry totals
 */
export const decrementSale = authenticatedMutation({
  args: {
    saleId: v.id("sales"),
    quantity: v.number(), // how much to reduce
  },
  handler: async (ctx, { saleId, quantity }) => {
    const sale = await ctx.db.get(saleId);
    if (!sale) throw new ConvexError("Sale not found.");

    const inventory = sale.inventoryId
      ? await ctx.db.get(sale.inventoryId)
      : null;

    const dailyEntry = await ctx.db.get(sale.dailyEntryId);
    if (!dailyEntry) throw new ConvexError("Daily entry not found.");

    if (!ctx.business || sale.businessId !== ctx.business._id)
      throw new ConvexError("Unauthorized.");

    if (quantity > sale.quantitySold)
      throw new ConvexError("Cannot decrement more than sold quantity.");

    const itemPrice = inventory
      ? inventory.retailPrice
      : sale.totalAmount / sale.quantitySold;
    const itemCost = inventory
      ? inventory.costPrice
      : sale.totalProfit / sale.quantitySold;

    const amountDelta = itemPrice * quantity;
    const profitDelta = (itemPrice - itemCost) * quantity;

    // Update sale
    await ctx.db.patch(saleId, {
      quantitySold: sale.quantitySold - quantity,
      totalAmount: sale.totalAmount - amountDelta,
      totalProfit: sale.totalProfit - profitDelta,
    });

    // Update inventory if applicable
    if (inventory) {
      await ctx.db.patch(inventory._id, {
        quantityAvailable: inventory.quantityAvailable + quantity,
      });
    }

    // Update daily entry totals
    const cashDelta = sale.paymentMethod === "cash" ? amountDelta : 0;
    const mpesaDelta = sale.paymentMethod === "mpesa" ? amountDelta : 0;

    await ctx.db.patch(dailyEntry._id, {
      cashTotal: dailyEntry.cashTotal - cashDelta,
      mpesaTotal: dailyEntry.mpesaTotal - mpesaDelta,
      salesTotal: dailyEntry.salesTotal - amountDelta,
      profitTotal: dailyEntry.profitTotal - profitDelta,
    });

    return { success: true, message: "Sale decremented successfully." };
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
    const sale = await ctx.db.get(saleId);
    if (!sale) throw new ConvexError("Sale not found.");

    const inventory = sale.inventoryId
      ? await ctx.db.get(sale.inventoryId)
      : null;

    const dailyEntry = await ctx.db.get(sale.dailyEntryId);
    if (!dailyEntry) throw new ConvexError("Daily entry not found.");

    if (!ctx.business || sale.businessId !== ctx.business._id)
      throw new ConvexError("Unauthorized.");

    // Update inventory back
    if (inventory) {
      await ctx.db.patch(inventory._id, {
        quantityAvailable: inventory.quantityAvailable + sale.quantitySold,
      });
    }

    // Update daily entry totals
    const cashDelta = sale.paymentMethod === "cash" ? sale.totalAmount : 0;
    const mpesaDelta = sale.paymentMethod === "mpesa" ? sale.totalAmount : 0;

    await ctx.db.patch(dailyEntry._id, {
      cashTotal: dailyEntry.cashTotal - cashDelta,
      mpesaTotal: dailyEntry.mpesaTotal - mpesaDelta,
      salesTotal: dailyEntry.salesTotal - sale.totalAmount,
      profitTotal: dailyEntry.profitTotal - sale.totalProfit,
    });

    // Delete the sale
    await ctx.db.delete(saleId);

    return { success: true, message: "Sale deleted successfully." };
  },
});
