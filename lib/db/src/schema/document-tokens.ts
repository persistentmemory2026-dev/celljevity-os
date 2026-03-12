import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { documentsTable } from "./documents";
import { usersTable } from "./users";

export const documentTokensTable = pgTable("document_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").references(() => documentsTable.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  purpose: text("purpose").notNull(),
  issuedTo: uuid("issued_to").references(() => usersTable.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DocumentToken = typeof documentTokensTable.$inferSelect;
