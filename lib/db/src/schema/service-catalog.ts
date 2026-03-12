import { pgTable, uuid, text, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serviceCategoryEnum = pgEnum("service_category", [
  "EXOSOMES",
  "PROMETHEUS",
  "NK_CELLS",
  "DIAGNOSTICS",
  "OTHER",
]);

export const serviceCatalogTable = pgTable("service_catalog", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: serviceCategoryEnum("category").notNull(),
  name: text("name").notNull(),
  defaultDescription: text("default_description"),
  basePriceEur: decimal("base_price_eur", { precision: 12, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isPartnerService: boolean("is_partner_service").notNull().default(false),
  partnerName: text("partner_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertServiceCatalogSchema = createInsertSchema(serviceCatalogTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertServiceCatalog = z.infer<typeof insertServiceCatalogSchema>;
export type ServiceCatalog = typeof serviceCatalogTable.$inferSelect;
