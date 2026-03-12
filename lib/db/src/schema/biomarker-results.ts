import { pgTable, uuid, text, timestamp, date, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";
import { usersTable } from "./users";

export const biomarkerTypeEnum = pgEnum("biomarker_type", [
  "DNA_METHYLATION_AGE",
  "TELOMERE_LENGTH",
  "NK_CELL_COUNT",
  "TUMOR_MARKER_CA125",
  "TUMOR_MARKER_PSA",
  "LDL_CHOLESTEROL",
  "HDL_CHOLESTEROL",
  "TRIGLYCERIDES",
  "FASTING_GLUCOSE",
  "HBA1C",
  "CRP",
  "VITAMIN_D",
  "TESTOSTERONE",
  "ESTRADIOL",
  "IGF1",
  "DHEA_S",
  "CORTISOL",
  "TSH",
  "FREE_T3",
  "FREE_T4",
  "LIVER_ALT",
  "LIVER_AST",
  "KIDNEY_CREATININE",
  "KIDNEY_GFR",
  "OTHER",
]);

export const biomarkerStatusEnum = pgEnum("biomarker_status", [
  "OPTIMAL",
  "NORMAL",
  "WARNING",
  "CRITICAL",
]);

export const biomarkerResultsTable = pgTable("biomarker_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patientsTable.id).notNull(),
  testDate: date("test_date").notNull(),
  biomarkerType: biomarkerTypeEnum("biomarker_type").notNull(),
  valueNumeric: decimal("value_numeric", { precision: 12, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  referenceRangeMin: decimal("reference_range_min", { precision: 12, scale: 4 }),
  referenceRangeMax: decimal("reference_range_max", { precision: 12, scale: 4 }),
  statusFlag: biomarkerStatusEnum("status_flag").notNull().default("NORMAL"),
  enteredBy: uuid("entered_by").references(() => usersTable.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBiomarkerResultSchema = createInsertSchema(biomarkerResultsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertBiomarkerResult = z.infer<typeof insertBiomarkerResultSchema>;
export type BiomarkerResult = typeof biomarkerResultsTable.$inferSelect;
