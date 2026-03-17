import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireRole } from "./auth";

export const list = query({
  args: {
    callerId: v.id("users"),
    status: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);

    let patients;
    if (args.status) {
      patients = await ctx.db
        .query("patients")
        .withIndex("by_status", (q: any) => q.eq("status", args.status))
        .collect();
    } else {
      patients = await ctx.db.query("patients").collect();
    }

    return patients.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    const patient = await ctx.db.get(args.patientId);
    if (!patient) throw new Error("Patient not found");
    return patient;
  },
});

export const create = mutation({
  args: {
    callerId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    street: v.optional(v.string()),
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    country: v.optional(v.string()),
    insuranceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  returns: v.id("patients"),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    const { callerId, ...data } = args;
    const now = Date.now();
    const patientId = await ctx.db.insert("patients", {
      ...data,
      country: data.country || "DE",
      status: "active",
      createdBy: callerId,
      createdAt: now,
      updatedAt: now,
    });

    // Schedule inbox creation if patient has an email
    if (data.email) {
      await ctx.scheduler.runAfter(0, internal.emailActions.createPatientInbox, {
        patientId,
      });
    }

    return patientId;
  },
});

export const update = mutation({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    street: v.optional(v.string()),
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    country: v.optional(v.string()),
    insuranceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    language: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    const patient = await ctx.db.get(args.patientId);
    if (!patient) throw new Error("Patient not found");

    const { callerId: _, patientId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }

    await ctx.db.patch(patientId, updates);
    return null;
  },
});

export const archive = mutation({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator"]);
    const patient = await ctx.db.get(args.patientId);
    if (!patient) throw new Error("Patient not found");

    await ctx.db.patch(args.patientId, {
      status: "archived",
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const count = query({
  args: { callerId: v.id("users") },
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .collect();
    return patients.length;
  },
});

// ─── Internal helpers for email actions ─────────────────────────────

export const getInternal = internalQuery({
  args: { patientId: v.id("patients") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.patientId);
  },
});

export const getByInboxId = internalQuery({
  args: { agentmailInboxId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("patients")
      .withIndex("by_agentmailInboxId", (q: any) =>
        q.eq("agentmailInboxId", args.agentmailInboxId)
      )
      .unique();
  },
});

export const getByEmail = internalQuery({
  args: { email: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const patients = await ctx.db.query("patients").collect();
    return patients.find((p: any) => p.email === args.email) ?? null;
  },
});

export const patchAgentmail = mutation({
  args: {
    patientId: v.id("patients"),
    agentmailInboxId: v.string(),
    agentmailAddress: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.patientId, {
      agentmailInboxId: args.agentmailInboxId,
      agentmailAddress: args.agentmailAddress,
      updatedAt: Date.now(),
    });
    return null;
  },
});
