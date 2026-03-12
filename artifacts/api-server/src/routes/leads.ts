import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { leadsTable, patientsTable, usersTable, leadStatusEnum, leadSourceEnum } from "@workspace/db/schema";
import { eq, and, ilike, sql, desc } from "drizzle-orm";
import { requireAuth, requireRole, auditLog, type AuthenticatedRequest } from "../middlewares";
import bcrypt from "bcrypt";

const router: IRouter = Router();

const VALID_LEAD_STATUSES = leadStatusEnum.enumValues;
const VALID_LEAD_SOURCES = leadSourceEnum.enumValues;

router.get(
  "/leads",
  requireAuth,
  requireRole("CARE_COORDINATOR", "SUPER_ADMIN"),
  auditLog("LIST_LEADS"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { status, source, search, limit: limitStr, offset: offsetStr } = req.query;

      const conditions: ReturnType<typeof eq>[] = [];

      if (status && typeof status === "string" && VALID_LEAD_STATUSES.includes(status as typeof VALID_LEAD_STATUSES[number])) {
        conditions.push(eq(leadsTable.status, status as typeof VALID_LEAD_STATUSES[number]));
      }
      if (source && typeof source === "string" && VALID_LEAD_SOURCES.includes(source as typeof VALID_LEAD_SOURCES[number])) {
        conditions.push(eq(leadsTable.source, source as typeof VALID_LEAD_SOURCES[number]));
      }
      if (search && typeof search === "string") {
        conditions.push(
          sql`(${leadsTable.firstName} ILIKE ${"%" + search + "%"} OR ${leadsTable.lastName} ILIKE ${"%" + search + "%"} OR ${leadsTable.email} ILIKE ${"%" + search + "%"})` as ReturnType<typeof eq>
        );
      }

      const limit = Math.min(parseInt(limitStr as string) || 50, 100);
      const offset = parseInt(offsetStr as string) || 0;

      const query = db.select().from(leadsTable).orderBy(desc(leadsTable.createdAt));
      const result = conditions.length > 0
        ? await query.where(and(...conditions)).limit(limit).offset(offset)
        : await query.limit(limit).offset(offset);

      const countQuery = conditions.length > 0
        ? db.select({ count: sql<number>`count(*)` }).from(leadsTable).where(and(...conditions))
        : db.select({ count: sql<number>`count(*)` }).from(leadsTable);
      const [{ count }] = await countQuery;

      res.json({ data: result, total: Number(count), limit, offset });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/leads/:leadId",
  requireAuth,
  requireRole("CARE_COORDINATOR", "SUPER_ADMIN"),
  auditLog("VIEW_LEAD", (req) => ({ type: "lead", id: req.params.leadId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [lead] = await db
        .select()
        .from(leadsTable)
        .where(eq(leadsTable.id, req.params.leadId))
        .limit(1);

      if (!lead) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }

      res.json(lead);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/leads",
  requireAuth,
  requireRole("CARE_COORDINATOR", "SUPER_ADMIN"),
  auditLog("CREATE_LEAD"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { firstName, lastName, email, phone, source, notes } = req.body;

      if (!firstName || !lastName || !email) {
        res.status(400).json({ error: "firstName, lastName, email are required" });
        return;
      }

      const existing = await db
        .select({ id: leadsTable.id })
        .from(leadsTable)
        .where(eq(leadsTable.email, email))
        .limit(1);

      if (existing.length > 0) {
        res.status(409).json({ error: "A lead with this email already exists" });
        return;
      }

      const validSource = source && VALID_LEAD_SOURCES.includes(source)
        ? source
        : "WEBSITE";

      const [lead] = await db.insert(leadsTable).values({
        firstName,
        lastName,
        email,
        phone,
        source: validSource,
        notes,
        assignedTo: req.user!.id,
      }).returning();

      res.status(201).json(lead);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/leads/:leadId",
  requireAuth,
  requireRole("CARE_COORDINATOR", "SUPER_ADMIN"),
  auditLog("UPDATE_LEAD", (req) => ({ type: "lead", id: req.params.leadId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { firstName, lastName, phone, source, status, notes, assignedTo } = req.body;
      const updates: Partial<typeof leadsTable.$inferInsert> = { updatedAt: new Date() };

      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (phone !== undefined) updates.phone = phone;
      if (notes !== undefined) updates.notes = notes;
      if (assignedTo !== undefined) updates.assignedTo = assignedTo;
      if (source && VALID_LEAD_SOURCES.includes(source)) updates.source = source;
      if (status && VALID_LEAD_STATUSES.includes(status)) updates.status = status;

      const [updated] = await db
        .update(leadsTable)
        .set(updates)
        .where(eq(leadsTable.id, req.params.leadId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/leads/:leadId/convert",
  requireAuth,
  requireRole("CARE_COORDINATOR", "SUPER_ADMIN"),
  auditLog("CONVERT_LEAD", (req) => ({ type: "lead", id: req.params.leadId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [lead] = await db
        .select()
        .from(leadsTable)
        .where(eq(leadsTable.id, req.params.leadId))
        .limit(1);

      if (!lead) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }

      if (lead.status === "CONVERTED") {
        res.status(409).json({ error: "Lead is already converted" });
        return;
      }

      const existingUser = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, lead.email))
        .limit(1);

      if (existingUser.length > 0) {
        res.status(409).json({ error: "A user with this email already exists" });
        return;
      }

      const tempPassword = `Celljevity-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      const [user] = await db.insert(usersTable).values({
        email: lead.email,
        passwordHash,
        role: "PATIENT",
        firstName: lead.firstName,
        lastName: lead.lastName,
      }).returning();

      const celljevityId = `CELL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const [patient] = await db.insert(patientsTable).values({
        userId: user.id,
        celljevityId,
        journeyStage: "ACQUISITION",
        isLead: false,
        phone: lead.phone,
      }).returning();

      await db
        .update(leadsTable)
        .set({
          status: "CONVERTED",
          convertedPatientId: patient.id,
          updatedAt: new Date(),
        })
        .where(eq(leadsTable.id, lead.id));

      res.json({
        message: "Lead converted to patient",
        patient: {
          id: patient.id,
          celljevityId: patient.celljevityId,
          userId: user.id,
        },
        temporaryPassword: tempPassword,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/leads/:leadId",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  auditLog("DELETE_LEAD", (req) => ({ type: "lead", id: req.params.leadId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [deleted] = await db
        .delete(leadsTable)
        .where(eq(leadsTable.id, req.params.leadId))
        .returning();

      if (!deleted) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }

      res.json({ message: "Lead deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
