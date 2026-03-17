import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

async function requireAuth(ctx: { db: any }, callerId: string) {
  const caller = await ctx.db.get(callerId as any);
  if (!caller) throw new Error("Unauthorized: user not found");
  return caller;
}

export const listByItinerary = query({
  args: {
    callerId: v.id("users"),
    itineraryId: v.id("itineraries"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.callerId);
    const items = await ctx.db
      .query("itineraryItems")
      .withIndex("by_itinerary", (q: any) => q.eq("itineraryId", args.itineraryId))
      .collect();
    return items.sort((a: any, b: any) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.sortOrder - b.sortOrder;
    });
  },
});

export const create = mutation({
  args: {
    callerId: v.id("users"),
    itineraryId: v.id("itineraries"),
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    date: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    location: v.optional(v.string()),
    treatmentId: v.optional(v.id("treatments")),
    sortOrder: v.number(),
    status: v.optional(v.string()),
  },
  returns: v.id("itineraryItems"),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.callerId);
    const { callerId: _, ...data } = args;
    return await ctx.db.insert("itineraryItems", {
      ...data,
      status: data.status || "pending",
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    callerId: v.id("users"),
    itemId: v.id("itineraryItems"),
    type: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    location: v.optional(v.string()),
    treatmentId: v.optional(v.id("treatments")),
    sortOrder: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.callerId);
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Itinerary item not found");

    const { callerId: _, itemId, ...fields } = args;
    const updates: Record<string, any> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }

    await ctx.db.patch(itemId, updates);
    return null;
  },
});

export const remove = mutation({
  args: {
    callerId: v.id("users"),
    itemId: v.id("itineraryItems"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.callerId);
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Itinerary item not found");
    await ctx.db.delete(args.itemId);
    return null;
  },
});

export const reorder = mutation({
  args: {
    callerId: v.id("users"),
    items: v.array(
      v.object({
        itemId: v.id("itineraryItems"),
        sortOrder: v.number(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.callerId);
    for (const { itemId, sortOrder } of args.items) {
      await ctx.db.patch(itemId, { sortOrder });
    }
    return null;
  },
});
