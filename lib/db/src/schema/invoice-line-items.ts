import { pgTable, uuid, text, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { quotesTable } from "./quotes";
import { serviceCatalogTable } from "./service-catalog";

export const invoiceLineItemsTable = pgTable("invoice_line_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  quoteId: uuid("quote_id").references(() => quotesTable.id, { onDelete: "cascade" }).notNull(),
  serviceId: uuid("service_id").references(() => serviceCatalogTable.id).notNull(),
  customDescription: text("custom_description"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }).notNull(),
});

export const insertInvoiceLineItemSchema = createInsertSchema(invoiceLineItemsTable).omit({
  id: true,
});

export type InsertInvoiceLineItem = z.infer<typeof insertInvoiceLineItemSchema>;
export type InvoiceLineItem = typeof invoiceLineItemsTable.$inferSelect;
