import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { requireRole } from "./auth";

export const listByPatient = query({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    const jobs = await ctx.db
      .query("extractionJobs")
      .withIndex("by_patient", (q: any) => q.eq("patientId", args.patientId))
      .collect();
    return jobs.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

export const listPendingReview = query({
  args: {
    callerId: v.id("users"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    const jobs = await ctx.db
      .query("extractionJobs")
      .withIndex("by_status", (q: any) => q.eq("status", "review"))
      .collect();
    return jobs.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: {
    callerId: v.id("users"),
    jobId: v.id("extractionJobs"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    return await ctx.db.get(args.jobId);
  },
});

export const create = internalMutation({
  args: {
    patientId: v.id("patients"),
    documentId: v.optional(v.id("documents")),
    driveFileId: v.optional(v.string()),
    fileName: v.string(),
    status: v.string(),
  },
  returns: v.id("extractionJobs"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("extractionJobs", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = internalMutation({
  args: {
    jobId: v.id("extractionJobs"),
    status: v.string(),
    extractedData: v.optional(v.any()),
    resultCount: v.optional(v.number()),
    error: v.optional(v.string()),
    confidence: v.optional(v.number()),
    measuredAt: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { jobId, ...updates } = args;
    await ctx.db.patch(jobId, {
      ...updates,
      updatedAt: Date.now(),
    });
    return null;
  },
});
