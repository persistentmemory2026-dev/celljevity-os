import { pgTable, uuid, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";
import { usersTable } from "./users";

export const documentTypeEnum = pgEnum("document_type", [
  "LAB_RESULT",
  "DOCTOR_LETTER",
  "SIGNED_CONSENT",
  "BIOPSY_REPORT",
  "INVOICE_PDF",
  "IMAGING",
  "OTHER",
]);

export const documentsTable = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patientsTable.id).notNull(),
  uploadedBy: uuid("uploaded_by").references(() => usersTable.id).notNull(),
  documentType: documentTypeEnum("document_type").notNull(),
  fileName: text("file_name").notNull(),
  storageKey: text("storage_key").notNull(),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  id: true,
  uploadDate: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
