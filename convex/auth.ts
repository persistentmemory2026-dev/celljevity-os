import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  returns: v.union(
    v.object({ userId: v.id("users"), email: v.string(), name: v.string(), role: v.string() }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) return null;

    const valid = bcrypt.compareSync(args.password, user.passwordHash);
    if (!valid) {
      // Fallback: check legacy simpleHash for unmigrated users
      const legacyHash = simpleHash(args.password);
      if (legacyHash !== user.passwordHash) return null;

      // SECURITY WARNING: user still on legacy hash — migrating now
      console.warn(
        `[SECURITY] User ${user.email} authenticated via legacy simpleHash. Migrating to bcrypt. Consider forcing a password reset.`
      );

      // Migrate to bcrypt on successful legacy login
      const newHash = bcrypt.hashSync(args.password, SALT_ROUNDS);
      await ctx.db.patch(user._id, { passwordHash: newHash });
    }

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
});

export const getMe = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({ userId: v.id("users"), email: v.string(), name: v.string(), role: v.string() }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
});

// Seed initial admin with bcrypt hash
export const seedAdmin = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@celljevity.com"))
      .unique();

    if (existing) return "Admin already exists";

    const passwordHash = bcrypt.hashSync("admin123", SALT_ROUNDS);
    await ctx.db.insert("users", {
      email: "admin@celljevity.com",
      passwordHash,
      name: "Admin User",
      role: "admin",
    });

    return "Admin created: admin@celljevity.com / admin123";
  },
});

// Helper: require user has one of the allowed roles
export async function requireRole(
  ctx: { db: any },
  callerId: string,
  allowedRoles: string[]
) {
  const caller = await ctx.db.get(callerId as any);
  if (!caller) {
    throw new Error("Unauthorized: user not found");
  }
  if (!allowedRoles.includes(caller.role)) {
    throw new Error(`Forbidden: requires one of [${allowedRoles.join(", ")}]`);
  }
  return caller;
}

// Legacy hash for migration compatibility
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "hash_" + Math.abs(hash).toString(16);
}
