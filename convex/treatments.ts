import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireRole, requirePatientSelfOrRole } from "./auth";

export const listByPatient = query({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requirePatientSelfOrRole(ctx, args.callerId, args.patientId, ["admin", "coordinator", "provider"]);
    const treatments = await ctx.db
      .query("treatments")
      .withIndex("by_patient", (q: any) => q.eq("patientId", args.patientId))
      .collect();
    return treatments.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: {
    callerId: v.id("users"),
    treatmentId: v.id("treatments"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    const treatment = await ctx.db.get(args.treatmentId);
    if (!treatment) throw new Error("Treatment not found");
    return treatment;
  },
});

export const create = mutation({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
    serviceId: v.id("services"),
    scheduledDate: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  returns: v.id("treatments"),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);

    const service = await ctx.db.get(args.serviceId);
    if (!service) throw new Error("Service not found");

    const now = Date.now();
    return await ctx.db.insert("treatments", {
      patientId: args.patientId,
      serviceId: args.serviceId,
      serviceName: service.name,
      status: "scheduled",
      scheduledDate: args.scheduledDate,
      performedBy: args.performedBy,
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
    treatmentId: v.id("treatments"),
    status: v.optional(v.string()),
    scheduledDate: v.optional(v.string()),
    completedDate: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    const treatment = await ctx.db.get(args.treatmentId);
    if (!treatment) throw new Error("Treatment not found");

    const { callerId: _, treatmentId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }

    // Auto-set completedDate when completing
    if (args.status === "completed" && !args.completedDate) {
      updates.completedDate = new Date().toISOString().split("T")[0];
    }

    await ctx.db.patch(treatmentId, updates);
    return null;
  },
});

export const remove = mutation({
  args: {
    callerId: v.id("users"),
    treatmentId: v.id("treatments"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    const treatment = await ctx.db.get(args.treatmentId);
    if (!treatment) throw new Error("Treatment not found");

    // Clean up references: null out treatmentId on related biomarkerResults
    const biomarkerResults = await ctx.db
      .query("biomarkerResults")
      .withIndex("by_treatment", (q: any) => q.eq("treatmentId", args.treatmentId))
      .collect();
    for (const br of biomarkerResults) {
      await ctx.db.patch(br._id, { treatmentId: undefined });
    }

    // Clean up references: null out treatmentId on related itineraryItems
    const itineraryItems = await ctx.db
      .query("itineraryItems")
      .filter((q: any) => q.eq(q.field("treatmentId"), args.treatmentId))
      .collect();
    for (const item of itineraryItems) {
      await ctx.db.patch(item._id, { treatmentId: undefined });
    }

    await ctx.db.delete(args.treatmentId);
    return null;
  },
});
