import { pgTable, uuid, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";

export const intakeFormsTable = pgTable("intake_forms", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patientsTable.id).notNull(),
  personalProfile: jsonb("personal_profile"),
  medicalHistory: jsonb("medical_history"),
  consentData: jsonb("consent_data"),
  isComplete: boolean("is_complete").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIntakeFormSchema = createInsertSchema(intakeFormsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type InsertIntakeForm = z.infer<typeof insertIntakeFormSchema>;
export type IntakeForm = typeof intakeFormsTable.$inferSelect;
