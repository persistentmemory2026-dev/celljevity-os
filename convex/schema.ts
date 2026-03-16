import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.string(), // admin, coordinator, provider
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  services: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    category: v.string(), // Exosomes, Prometheus, NK Cells, Diagnostics, Other
    active: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_active", ["active"]),

  quotes: defineTable({
    userId: v.id("users"),
    quoteNumber: v.string(),
    type: v.string(), // quote, invoice
    status: v.string(), // draft, sent, accepted, paid, cancelled
    
    // Customer Info
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    
    // Totals
    subtotal: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    total: v.number(),
    
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_quoteNumber", ["quoteNumber"]),

  quoteItems: defineTable({
    quoteId: v.id("quotes"),
    serviceId: v.id("services"),
    serviceName: v.string(), // Snapshot for PDF
    quantity: v.number(),
    unitPrice: v.number(),
    total: v.number(),
  })
    .index("by_quote", ["quoteId"]),

  documents: defineTable({
    userId: v.id("users"),
    filename: v.string(),
    originalName: v.string(),
    mimeType: v.string(),
    size: v.number(),
    storageId: v.optional(v.id("_storage")), // Convex storage
    category: v.string(), // invoice, quote, lab-report, other
    relatedQuoteId: v.optional(v.id("quotes")),
    shareToken: v.optional(v.string()),
    shareExpiresAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_quote", ["relatedQuoteId"])
    .index("by_shareToken", ["shareToken"]),
});
