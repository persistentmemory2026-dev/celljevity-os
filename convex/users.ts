import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

async function requireAdmin(ctx: { db: any }, callerId: string) {
  const caller = await ctx.db.get(callerId as any);
  if (!caller || caller.role !== "admin") {
    throw new Error("Unauthorized: admin access required");
  }
  return caller;
}

export const seedSystemUser = internalMutation({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "system@celljevity.internal"))
      .unique();
    if (existing) return null; // already exists

    const passwordHash = bcrypt.hashSync("system-no-login", SALT_ROUNDS);
    return await ctx.db.insert("users", {
      email: "system@celljevity.internal",
      passwordHash,
      name: "System (Automated)",
      role: "admin",
    });
  },
});

export const getSystemUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      email: v.string(),
      name: v.string(),
      role: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "system@celljevity.internal"))
      .unique();
    if (!user) return null;
    // Never expose passwordHash
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
});

export const listUsers = query({
  args: { callerId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      email: v.string(),
      name: v.string(),
      role: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.callerId);
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
    }));
  },
});

export const createUser = mutation({
  args: {
    callerId: v.id("users"),
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.callerId);

    // Check for duplicate email
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (existing) {
      throw new Error("A user with this email already exists");
    }

    const passwordHash = bcrypt.hashSync(args.password, SALT_ROUNDS);
    return await ctx.db.insert("users", {
      email: args.email,
      passwordHash,
      name: args.name,
      role: args.role,
    });
  },
});

export const updateUser = mutation({
  args: {
    callerId: v.id("users"),
    userId: v.id("users"),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.callerId);

    // Prevent self-demotion
    if (args.callerId === args.userId && args.role && args.role !== "admin") {
      throw new Error("Cannot change your own role");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Check email uniqueness if changing email
    if (args.email && args.email !== user.email) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .unique();
      if (existing) {
        throw new Error("A user with this email already exists");
      }
    }

    const updates: Record<string, string> = {};
    if (args.email) updates.email = args.email;
    if (args.name) updates.name = args.name;
    if (args.role) updates.role = args.role;

    await ctx.db.patch(args.userId, updates);
    return null;
  },
});

export const deleteUser = mutation({
  args: {
    callerId: v.id("users"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.callerId);

    // Prevent self-deletion
    if (args.callerId === args.userId) {
      throw new Error("Cannot delete your own account");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.delete(args.userId);
    return null;
  },
});
