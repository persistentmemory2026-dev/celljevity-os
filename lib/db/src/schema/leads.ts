import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const leadSourceEnum = pgEnum("lead_source", [
  "WEBSITE",
  "REFERRAL",
  "PARTNER",
  "EVENT",
  "SOCIAL_MEDIA",
  "DIRECT",
  "OTHER",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONVERTED",
  "LOST",
]);

export const leadsTable = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  source: leadSourceEnum("source").notNull().default("WEBSITE"),
  status: leadStatusEnum("status").notNull().default("NEW"),
  notes: text("notes"),
  assignedTo: uuid("assigned_to").references(() => usersTable.id),
  convertedPatientId: uuid("converted_patient_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
