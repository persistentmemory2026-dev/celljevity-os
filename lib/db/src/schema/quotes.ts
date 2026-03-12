import { pgTable, uuid, text, timestamp, date, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";
import { usersTable } from "./users";

export const quoteStatusEnum = pgEnum("quote_status", [
  "DRAFT",
  "PENDING",
  "ACCEPTED",
  "PAID",
  "CANCELLED",
]);

export const quotesTable = pgTable("quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  patientId: uuid("patient_id").references(() => patientsTable.id).notNull(),
  createdBy: uuid("created_by").references(() => usersTable.id).notNull(),
  status: quoteStatusEnum("status").notNull().default("DRAFT"),
  issueDate: date("issue_date").notNull(),
  currency: text("currency").notNull().default("EUR"),
  exchangeRateUsed: decimal("exchange_rate_used", { precision: 12, scale: 6 }).notNull().default("1.000000"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  notesAndTerms: text("notes_and_terms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertQuoteSchema = createInsertSchema(quotesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotesTable.$inferSelect;
