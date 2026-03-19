import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requirePatientSelfOrRole } from "./auth";

async function requireAuth(ctx: { db: any }, callerId: string) {
  const caller = await ctx.db.get(callerId as any);
  if (!caller) throw new Error("Unauthorized: user not found");
  return caller;
}

export const listByPatient = query({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requirePatientSelfOrRole(ctx, args.callerId, args.patientId, ["admin", "coordinator", "provider"]);
    const itineraries = await ctx.db
      .query("itineraries")
      .withIndex("by_patient", (q: any) => q.eq("patientId", args.patientId))
      .collect();
    return itineraries.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: {
    callerId: v.id("users"),
    itineraryId: v.id("itineraries"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.callerId);
    const itinerary = await ctx.db.get(args.itineraryId);
    if (!itinerary) throw new Error("Itinerary not found");
    return itinerary;
  },
});

export const create = mutation({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
    title: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    notes: v.optional(v.string()),
  },
  returns: v.id("itineraries"),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.callerId);
    const now = Date.now();
    return await ctx.db.insert("itineraries", {
      patientId: args.patientId,
      title: args.title,
      status: "draft",
      startDate: args.startDate,
      endDate: args.endDate,
      notes: args.notes,
      createdBy: args.callerId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    callerId: v.id("users"),
    itineraryId: v.id("itineraries"),
    title: v.optional(v.string()),
    status: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.callerId);
    const itinerary = await ctx.db.get(args.itineraryId);
    if (!itinerary) throw new Error("Itinerary not found");

    const { callerId: _, itineraryId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }

    await ctx.db.patch(itineraryId, updates);
    return null;
  },
});

export const remove = mutation({
  args: {
    callerId: v.id("users"),
    itineraryId: v.id("itineraries"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.callerId);
    const itinerary = await ctx.db.get(args.itineraryId);
    if (!itinerary) throw new Error("Itinerary not found");

    // Also delete all items
    const items = await ctx.db
      .query("itineraryItems")
      .withIndex("by_itinerary", (q: any) => q.eq("itineraryId", args.itineraryId))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.itineraryId);
    return null;
  },
});
