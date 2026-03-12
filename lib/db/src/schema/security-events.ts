import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const securityEventsTable = pgTable("security_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id),
  eventType: text("event_type").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type SecurityEvent = typeof securityEventsTable.$inferSelect;
