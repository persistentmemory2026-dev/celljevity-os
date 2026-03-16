import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// List documents for user
export const list = query({
  args: { 
    userId: v.id("users"),
    category: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let docs = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    if (args.category) {
      docs = docs.filter(d => d.category === args.category);
    }
    
    // Sort by createdAt desc
    return docs.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Create document record (after upload)
export const create = mutation({
  args: {
    userId: v.id("users"),
    filename: v.string(),
    originalName: v.string(),
    mimeType: v.string(),
    size: v.number(),
    storageId: v.optional(v.id("_storage")),
    category: v.string(),
    relatedQuoteId: v.optional(v.id("quotes")),
  },
  returns: v.id("documents"),
  handler: async (ctx, args) => {
    // Generate share token
    const shareToken = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
    const shareExpiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    
    return await ctx.db.insert("documents", {
      ...args,
      shareToken,
      shareExpiresAt,
      createdAt: Date.now(),
    });
  },
});

// Delete document
export const remove = mutation({
  args: { documentId: v.id("documents") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) return false;
    
    // Delete from storage if exists
    if (doc.storageId) {
      await ctx.storage.delete(doc.storageId);
    }
    
    await ctx.db.delete(args.documentId);
    return true;
  },
});

// Get download URL for document
export const getDownloadUrl = action({
  args: { documentId: v.id("documents") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.runQuery(api.documents.getInternal, { documentId: args.documentId });
    if (!doc || !doc.storageId) return null;
    
    return await ctx.storage.getUrl(doc.storageId);
  },
});

// Internal query for action
export const getInternal = query({
  args: { documentId: v.id("documents") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

// Validate share token
export const validateShare = query({
  args: { token: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("documents")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.token))
      .unique();
    
    if (!doc) return null;
    if (doc.shareExpiresAt < Date.now()) return null;
    
    return doc;
  },
});
