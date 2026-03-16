import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Simple hash function (for MVP - replace with proper hash in production)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "hash_" + Math.abs(hash).toString(16);
}

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
    
    // Simple hash comparison (replace with bcrypt in production)
    const hashedInput = simpleHash(args.password);
    if (hashedInput !== user.passwordHash) return null;
    
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

// Seed initial admin
export const seedAdmin = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@celljevity.com"))
      .unique();
    
    if (existing) return "Admin already exists";
    
    const passwordHash = simpleHash("admin123");
    await ctx.db.insert("users", {
      email: "admin@celljevity.com",
      passwordHash,
      name: "Admin User",
      role: "admin",
    });
    
    return "Admin created: admin@celljevity.com / admin123";
  },
});
