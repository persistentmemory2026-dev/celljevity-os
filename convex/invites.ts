import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import bcrypt from "bcryptjs";
import { requireRole } from "./auth";

const SALT_ROUNDS = 10;
const INVITE_EXPIRY_MS = 72 * 60 * 60 * 1000; // 72 hours

export const createInvite = mutation({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
  },
  returns: v.object({ token: v.string(), email: v.string() }),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator"]);

    const patient = await ctx.db.get(args.patientId);
    if (!patient) throw new Error("Patient not found");
    if (!patient.email) throw new Error("Patient has no email address");

    // Check no existing user login for this patient
    const existingLogin = await ctx.db
      .query("users")
      .withIndex("by_linkedPatientId", (q: any) => q.eq("linkedPatientId", args.patientId))
      .unique();
    if (existingLogin) throw new Error("Patient already has a login");

    // Revoke any active (non-expired, non-used) invites for this patient
    const existingInvites = await ctx.db
      .query("inviteTokens")
      .withIndex("by_patientId", (q: any) => q.eq("patientId", args.patientId))
      .collect();
    const now = Date.now();
    for (const inv of existingInvites) {
      if (!inv.usedAt && inv.expiresAt > now) {
        await ctx.db.patch(inv._id, { usedAt: now }); // revoke
      }
    }

    // Generate token
    const token = crypto.randomUUID();
    await ctx.db.insert("inviteTokens", {
      token,
      patientId: args.patientId,
      email: patient.email,
      createdBy: args.callerId,
      expiresAt: now + INVITE_EXPIRY_MS,
    });

    // Schedule email send
    await ctx.scheduler.runAfter(0, internal.emailActions.sendInviteEmail, {
      patientId: args.patientId,
      token,
    });

    return { token, email: patient.email };
  },
});

export const validateInvite = query({
  args: { token: v.string() },
  returns: v.object({
    valid: v.boolean(),
    email: v.optional(v.string()),
    patientName: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("inviteTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invite || invite.usedAt || invite.expiresAt < Date.now()) {
      return { valid: false };
    }

    const patient = await ctx.db.get(invite.patientId);
    return {
      valid: true,
      email: invite.email,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : undefined,
    };
  },
});

export const acceptInvite = mutation({
  args: {
    token: v.string(),
    password: v.string(),
  },
  returns: v.object({
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
    role: v.string(),
    linkedPatientId: v.id("patients"),
  }),
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("inviteTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invite) throw new Error("Invalid invite link");
    if (invite.usedAt) throw new Error("This invite has already been used");
    if (invite.expiresAt < Date.now()) throw new Error("This invite has expired");
    if (args.password.length < 8) throw new Error("Password must be at least 8 characters");

    const patient = await ctx.db.get(invite.patientId);
    if (!patient) throw new Error("Patient not found");

    // Check no existing user login
    const existingLogin = await ctx.db
      .query("users")
      .withIndex("by_linkedPatientId", (q: any) => q.eq("linkedPatientId", invite.patientId))
      .unique();
    if (existingLogin) throw new Error("An account already exists for this patient");

    // Also check by email
    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", invite.email))
      .unique();
    if (existingEmail) throw new Error("A user with this email already exists");

    const passwordHash = bcrypt.hashSync(args.password, SALT_ROUNDS);
    const name = `${patient.firstName} ${patient.lastName}`;
    const userId = await ctx.db.insert("users", {
      email: invite.email,
      passwordHash,
      name,
      role: "patient",
      linkedPatientId: invite.patientId,
    });

    // Mark invite as used
    await ctx.db.patch(invite._id, { usedAt: Date.now() });

    return {
      userId,
      email: invite.email,
      name,
      role: "patient",
      linkedPatientId: invite.patientId,
    };
  },
});

export const getInviteStatus = query({
  args: {
    callerId: v.id("users"),
    patientId: v.id("patients"),
  },
  returns: v.object({
    hasActiveInvite: v.boolean(),
    sentAt: v.optional(v.number()),
    email: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);

    const invites = await ctx.db
      .query("inviteTokens")
      .withIndex("by_patientId", (q: any) => q.eq("patientId", args.patientId))
      .collect();

    const now = Date.now();
    const active = invites.find((inv) => !inv.usedAt && inv.expiresAt > now);

    return {
      hasActiveInvite: !!active,
      sentAt: active?._creationTime,
      email: active?.email,
    };
  },
});
