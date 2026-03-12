import { pgTable, uuid, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";

export const consentTypeEnum = pgEnum("consent_type", [
  "DATA_PROCESSING",
  "MEDICAL_DATA_SHARING",
  "MARKETING_COMMUNICATIONS",
  "TERMS_AND_CONDITIONS",
  "TREATMENT_CONSENT",
]);

export const consentRecordsTable = pgTable("consent_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patientsTable.id).notNull(),
  consentType: consentTypeEnum("consent_type").notNull(),
  version: text("version").notNull().default("1.0"),
  granted: boolean("granted").notNull().default(false),
  ipAddress: text("ip_address"),
  jurisdiction: text("jurisdiction"),
  grantedAt: timestamp("granted_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertConsentRecordSchema = createInsertSchema(consentRecordsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertConsentRecord = z.infer<typeof insertConsentRecordSchema>;
export type ConsentRecord = typeof consentRecordsTable.$inferSelect;
