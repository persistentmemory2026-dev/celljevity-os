import { pgTable, uuid, text, timestamp, boolean, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const journeyStageEnum = pgEnum("journey_stage", [
  "ACQUISITION",
  "INTAKE",
  "DIAGNOSTICS",
  "PLANNING",
  "TREATMENT",
  "FOLLOW_UP",
]);

export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id).notNull().unique(),
  celljevityId: text("celljevity_id").notNull().unique(),
  dateOfBirth: date("date_of_birth"),
  phone: text("phone"),
  address: text("address"),
  journeyStage: journeyStageEnum("journey_stage").notNull().default("ACQUISITION"),
  medicalHistorySummary: text("medical_history_summary"),
  assignedCoordinatorId: uuid("assigned_coordinator_id").references(() => usersTable.id),
  assignedProviderId: uuid("assigned_provider_id").references(() => usersTable.id),
  isLead: boolean("is_lead").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;
