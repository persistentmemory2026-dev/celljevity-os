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
    const results = await ctx.db
      .query("biomarkerResults")
      .withIndex("by_patient", (q: any) => q.eq("patientId", args.patientId))
      .collect();
    return results.sort((a: any, b: any) => {
      const dateCompare = b.measuredAt.localeCompare(a.measuredAt);
      if (dateCompare !== 0) return dateCompare;
      return a.biomarkerName.localeCompare(b.biomarkerName);
    });
  },
});

export const listByPatientAndCode = query({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
    biomarkerCode: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requirePatientSelfOrRole(ctx, args.callerId, args.patientId, ["admin", "coordinator", "provider"]);
    const results = await ctx.db
      .query("biomarkerResults")
      .withIndex("by_patient_biomarker", (q: any) =>
        q.eq("patientId", args.patientId).eq("biomarkerCode", args.biomarkerCode)
      )
      .collect();
    return results.sort((a: any, b: any) => a.measuredAt.localeCompare(b.measuredAt));
  },
});

export const create = mutation({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
    treatmentId: v.optional(v.id("treatments")),
    documentId: v.optional(v.id("documents")),
    biomarkerCode: v.string(),
    biomarkerName: v.string(),
    value: v.number(),
    unit: v.string(),
    refRangeLow: v.optional(v.number()),
    refRangeHigh: v.optional(v.number()),
    measuredAt: v.string(),
  },
  returns: v.id("biomarkerResults"),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    const { callerId, ...data } = args;
    return await ctx.db.insert("biomarkerResults", {
      ...data,
      createdBy: callerId,
      createdAt: Date.now(),
    });
  },
});

export const createBatch = mutation({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
    treatmentId: v.optional(v.id("treatments")),
    documentId: v.optional(v.id("documents")),
    extractionJobId: v.optional(v.id("extractionJobs")),
    source: v.optional(v.string()),
    measuredAt: v.string(),
    results: v.array(
      v.object({
        biomarkerCode: v.string(),
        biomarkerName: v.string(),
        value: v.number(),
        unit: v.string(),
        refRangeLow: v.optional(v.number()),
        refRangeHigh: v.optional(v.number()),
        confidence: v.optional(v.number()),
      })
    ),
  },
  returns: v.array(v.id("biomarkerResults")),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    const ids = [];
    for (const result of args.results) {
      const id = await ctx.db.insert("biomarkerResults", {
        patientId: args.patientId,
        treatmentId: args.treatmentId,
        documentId: args.documentId,
        extractionJobId: args.extractionJobId,
        source: args.source,
        measuredAt: args.measuredAt,
        ...result,
        createdBy: args.callerId,
        createdAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

export const update = mutation({
  args: {
    callerId: v.id("users"),
    resultId: v.id("biomarkerResults"),
    value: v.optional(v.number()),
    measuredAt: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    const result = await ctx.db.get(args.resultId);
    if (!result) throw new Error("Biomarker result not found");

    const updates: Record<string, any> = {};
    if (args.value !== undefined) updates.value = args.value;
    if (args.measuredAt !== undefined) updates.measuredAt = args.measuredAt;

    await ctx.db.patch(args.resultId, updates);
    return null;
  },
});

export const remove = mutation({
  args: {
    callerId: v.id("users"),
    resultId: v.id("biomarkerResults"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    const result = await ctx.db.get(args.resultId);
    if (!result) throw new Error("Biomarker result not found");
    await ctx.db.delete(args.resultId);
    return null;
  },
});
