import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const serviceObject = v.object({
  _id: v.id("services"),
  _creationTime: v.number(),
  name: v.string(),
  description: v.optional(v.string()),
  price: v.number(),
  category: v.string(),
  active: v.boolean(),
});

async function requireAdmin(ctx: { db: any }, callerId: string) {
  const caller = await ctx.db.get(callerId as any);
  if (!caller || caller.role !== "admin") {
    throw new Error("Unauthorized: admin access required");
  }
  return caller;
}

// Get all active services (public)
export const list = query({
  args: {},
  returns: v.array(serviceObject),
  handler: async (ctx) => {
    return await ctx.db
      .query("services")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
  },
});

// Admin: list all services including inactive
export const listAll = query({
  args: { callerId: v.id("users") },
  returns: v.array(serviceObject),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.callerId);
    return await ctx.db.query("services").collect();
  },
});

// Admin: create service
export const createService = mutation({
  args: {
    callerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    category: v.string(),
    active: v.boolean(),
  },
  returns: v.id("services"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.callerId);
    const { callerId: _, ...data } = args;
    return await ctx.db.insert("services", data);
  },
});

// Admin: update service
export const updateService = mutation({
  args: {
    callerId: v.id("users"),
    serviceId: v.id("services"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.callerId);

    const service = await ctx.db.get(args.serviceId);
    if (!service) throw new Error("Service not found");

    const updates: Record<string, any> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.price !== undefined) updates.price = args.price;
    if (args.category !== undefined) updates.category = args.category;
    if (args.active !== undefined) updates.active = args.active;

    await ctx.db.patch(args.serviceId, updates);
    return null;
  },
});

// Admin: delete service
export const deleteService = mutation({
  args: {
    callerId: v.id("users"),
    serviceId: v.id("services"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.callerId);

    const service = await ctx.db.get(args.serviceId);
    if (!service) throw new Error("Service not found");

    // Check for references in treatments
    const treatments = await ctx.db
      .query("treatments")
      .filter((q: any) => q.eq(q.field("serviceId"), args.serviceId))
      .collect();
    // Check for references in quoteItems
    const quoteItems = await ctx.db
      .query("quoteItems")
      .filter((q: any) => q.eq(q.field("serviceId"), args.serviceId))
      .collect();

    if (treatments.length > 0 || quoteItems.length > 0) {
      throw new Error(
        `Cannot delete: service is used in ${treatments.length} treatment(s) and ${quoteItems.length} quote(s). Deactivate the service instead.`
      );
    }

    await ctx.db.delete(args.serviceId);
    return null;
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
