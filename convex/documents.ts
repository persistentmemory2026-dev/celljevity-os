import { v } from "convex/values";
import { query, mutation, action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireRole } from "./auth";

// Generate a short-lived upload URL for Convex storage
export const generateUploadUrl = mutation({
  args: { userId: v.id("users") },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Unauthorized");
    return await ctx.storage.generateUploadUrl();
  },
});

// List documents for user
export const list = query({
  args: { 
    userId: v.id("users"),
    category: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.userId, ["admin", "coordinator", "provider"]);
    let docs = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    if (args.category) {
      docs = docs.filter(d => d.category === args.category);
    }
    
    // Sort by createdAt desc
    docs.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    // Resolve storage URLs
    const docsWithUrls = await Promise.all(
      docs.map(async (doc) => ({
        ...doc,
        url: doc.storageId ? await ctx.storage.getUrl(doc.storageId) : null,
      }))
    );
    return docsWithUrls;
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
    category: v.union(v.literal("invoice"), v.literal("quote"), v.literal("lab-report"), v.literal("other")),
    relatedQuoteId: v.optional(v.id("quotes")),
    relatedPatientId: v.optional(v.id("patients")),
    relatedTreatmentId: v.optional(v.id("treatments")),
  },
  returns: v.id("documents"),
  handler: async (ctx, args) => {
    // Validate MIME type
    const ALLOWED_MIME_TYPES = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!ALLOWED_MIME_TYPES.includes(args.mimeType)) {
      throw new Error(`File type not allowed: ${args.mimeType}. Allowed: PDF, JPEG, PNG, DOCX, XLSX.`);
    }

    // Generate share token (48h expiry for healthcare documents)
    const shareToken = crypto.randomUUID();
    const shareExpiresAt = Date.now() + (48 * 60 * 60 * 1000); // 48 hours

    return await ctx.db.insert("documents", {
      ...args,
      shareToken,
      shareExpiresAt,
      createdAt: Date.now(),
    });
  },
});

// List documents for a patient
export const listByPatient = query({
  args: {
    userId: v.id("users"),
    patientId: v.id("patients"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.userId, ["admin", "coordinator", "provider"]);
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_patient", (q: any) => q.eq("relatedPatientId", args.patientId))
      .collect();
    docs.sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    const docsWithUrls = await Promise.all(
      docs.map(async (doc: any) => ({
        ...doc,
        url: doc.storageId ? await ctx.storage.getUrl(doc.storageId) : null,
      }))
    );
    return docsWithUrls;
  },
});

// Delete document
export const remove = mutation({
  args: { documentId: v.id("documents"), userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== args.userId) {
      throw new Error("Document not found or access denied");
    }

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
  handler: async (ctx, args): Promise<string | null> => {
    const doc = await ctx.runQuery(internal.documents.getInternal, { documentId: args.documentId });
    if (!doc || !doc.storageId) return null;

    return await ctx.storage.getUrl(doc.storageId);
  },
});

// Internal query — not callable from client
export const getInternal = internalQuery({
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
    if ((doc.shareExpiresAt ?? 0) < Date.now()) return null;

    // Only return fields needed for download — not full document
    return {
      _id: doc._id,
      storageId: doc.storageId,
      mimeType: doc.mimeType,
      originalName: doc.originalName,
    };
  },
});
