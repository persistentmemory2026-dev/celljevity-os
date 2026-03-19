import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { requirePatientSelfOrRole } from "./auth";

export const insert = internalMutation({
  args: {
    direction: v.string(),
    agentmailMessageId: v.string(),
    agentmailThreadId: v.optional(v.string()),
    inboxId: v.string(),
    patientId: v.optional(v.id("patients")),
    quoteId: v.optional(v.id("quotes")),
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    bodyPreview: v.optional(v.string()),
    hasAttachments: v.boolean(),
    status: v.string(),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  },
  returns: v.id("emailLog"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("emailLog", args);
    // Denormalize: update patient's lastContactedAt
    if (args.patientId) {
      await ctx.db.patch(args.patientId, { lastContactedAt: Date.now() });
    }
    return id;
  },
});

export const listByPatient = query({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requirePatientSelfOrRole(ctx, args.callerId, args.patientId, ["admin", "coordinator", "provider"]);
    const logs = await ctx.db
      .query("emailLog")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .collect();
    return logs.sort((a, b) => b.createdAt - a.createdAt);
  },
});
