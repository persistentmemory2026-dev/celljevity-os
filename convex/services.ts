import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all active services
export const list = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("services"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    category: v.string(),
    active: v.boolean(),
  })),
  handler: async (ctx) => {
    return await ctx.db
      .query("services")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
  },
});

// Seed default services
export const seedServices = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("services").collect();
    if (existing.length > 0) return "Services already seeded";
    
    const services = [
      { name: "Exosome Therapy - Basic", description: "Basic exosome treatment", price: 2500, category: "Exosomes", active: true },
      { name: "Exosome Therapy - Premium", description: "Advanced exosome therapy", price: 4500, category: "Exosomes", active: true },
      { name: "Prometheus Protocol", description: "Comprehensive longevity assessment", price: 8900, category: "Prometheus", active: true },
      { name: "NK Cell Therapy", description: "Natural killer cell immunotherapy", price: 6200, category: "NK Cells", active: true },
      { name: "Biomarker Panel - Standard", description: "Complete biomarker analysis", price: 1200, category: "Diagnostics", active: true },
      { name: "Consultation - Initial", description: "Initial consultation", price: 250, category: "Other", active: true },
    ];
    
    for (const service of services) {
      await ctx.db.insert("services", service);
    }
    
    return `Created ${services.length} services`;
  },
});
