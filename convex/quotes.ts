import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// List quotes for user
export const list = query({
  args: { 
    userId: v.id("users"),
    type: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let quotes = await ctx.db
      .query("quotes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    if (args.type) {
      quotes = quotes.filter(q => q.type === args.type);
    }
    
    // Sort by createdAt desc
    return quotes.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

// Get single quote with items
export const get = query({
  args: { quoteId: v.id("quotes"), userId: v.id("users") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) return null;
    if (quote.userId !== args.userId) return null;

    const items = await ctx.db
      .query("quoteItems")
      .withIndex("by_quote", (q) => q.eq("quoteId", args.quoteId))
      .collect();

    return { ...quote, items };
  },
});

// Create quote
export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("quote"), v.literal("invoice")),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    items: v.array(v.object({
      serviceId: v.id("services"),
      quantity: v.number(),
    })),
    notes: v.optional(v.string()),
    taxRate: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Generate quote number with unique suffix to avoid race conditions
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = args.type === "quote" ? "QUO" : "INV";
    const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
    const quoteNumber = `${prefix}-${today}-${suffix}`;
    
    // Calculate totals
    let subtotal = 0;
    const itemsToInsert = [];
    
    for (const item of args.items) {
      const service = await ctx.db.get(item.serviceId);
      if (!service) throw new Error("Service not found: " + item.serviceId);
      
      const unitPrice = service.price;
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;
      
      itemsToInsert.push({
        serviceId: item.serviceId,
        serviceName: service.name,
        quantity: item.quantity,
        unitPrice,
        total: itemTotal,
      });
    }
    
    const taxAmount = subtotal * (args.taxRate / 100);
    const total = subtotal + taxAmount;
    
    // Create quote
    const quoteId = await ctx.db.insert("quotes", {
      userId: args.userId,
      quoteNumber,
      type: args.type,
      status: "draft",
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      subtotal,
      taxRate: args.taxRate,
      taxAmount,
      total,
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create items
    for (const item of itemsToInsert) {
      await ctx.db.insert("quoteItems", { ...item, quoteId });
    }
    
    return await ctx.db.get(quoteId);
  },
});

// Update quote status
export const updateStatus = mutation({
  args: {
    quoteId: v.id("quotes"),
    userId: v.id("users"),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("accepted"), v.literal("paid"), v.literal("cancelled")),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote || quote.userId !== args.userId) {
      throw new Error("Quote not found or access denied");
    }
    await ctx.db.patch(args.quoteId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    // Send email when status changes to "sent"
    if (args.status === "sent" && quote.customerEmail) {
      await ctx.scheduler.runAfter(0, internal.emailActions.sendQuoteEmail, {
        quoteId: args.quoteId,
      });
    }

    return await ctx.db.get(args.quoteId);
  },
});

// Delete quote
export const remove = mutation({
  args: { quoteId: v.id("quotes"), userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote || quote.userId !== args.userId) {
      throw new Error("Quote not found or access denied");
    }

    // Delete items first
    const items = await ctx.db
      .query("quoteItems")
      .withIndex("by_quote", (q) => q.eq("quoteId", args.quoteId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.quoteId);
    return true;
  },
});

// Internal query for email actions — not callable from client
export const getInternal = internalQuery({
  args: { quoteId: v.id("quotes") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) return null;

    const items = await ctx.db
      .query("quoteItems")
      .withIndex("by_quote", (q) => q.eq("quoteId", args.quoteId))
      .collect();

    return { ...quote, items };
  },
});
