import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  patientsTable, usersTable, journeyStageEnum,
  documentsTable, documentTokensTable, intakeFormsTable,
  biomarkerResultsTable, consentRecordsTable, quotesTable,
  invoiceLineItemsTable, auditLogsTable, leadsTable,
} from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireRole, requireSelfOrRole, auditLog, type AuthenticatedRequest } from "../middlewares";
import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = path.resolve(process.cwd(), ".data/uploads");

const router: IRouter = Router();
const VALID_JOURNEY_STAGES = journeyStageEnum.enumValues;

type PatientListItem = {
  id: string;
  celljevityId: string;
  journeyStage: string;
  isLead: boolean;
  assignedCoordinatorId: string | null;
  assignedProviderId: string | null;
  createdAt: Date;
  firstName: string;
  lastName: string;
  email: string;
};

type PatientDetail = {
  id: string;
  userId: string;
  celljevityId: string;
  dateOfBirth: string | null;
  phone: string | null;
  address: string | null;
  journeyStage: string;
  assignedCoordinatorId: string | null;
  assignedProviderId: string | null;
  isLead: boolean;
  createdAt: Date;
  updatedAt: Date;
  firstName: string;
  lastName: string;
  email: string;
  medicalHistorySummary?: string | null;
};

function filterPatientByRole(patient: Record<string, unknown>, role: string): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: patient.id,
    userId: patient.userId,
    celljevityId: patient.celljevityId,
    journeyStage: patient.journeyStage,
    isLead: patient.isLead,
    assignedCoordinatorId: patient.assignedCoordinatorId,
    assignedProviderId: patient.assignedProviderId,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
  };

  if (role === "PATIENT") {
    base.dateOfBirth = patient.dateOfBirth;
    base.phone = patient.phone;
    base.address = patient.address;
    base.medicalHistorySummary = patient.medicalHistorySummary;
    return base;
  }

  base.dateOfBirth = patient.dateOfBirth;
  base.phone = patient.phone;
  base.address = patient.address;

  if (role === "MEDICAL_PROVIDER" || role === "SUPER_ADMIN") {
    base.medicalHistorySummary = patient.medicalHistorySummary;
  }

  return base;
}

router.get(
  "/patients",
  requireAuth,
  requireRole("CARE_COORDINATOR", "MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("LIST_PATIENTS"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { stage, isLead, search, limit: limitStr, offset: offsetStr } = req.query;

      const conditions: ReturnType<typeof eq>[] = [];
      if (stage && typeof stage === "string" && VALID_JOURNEY_STAGES.includes(stage as typeof VALID_JOURNEY_STAGES[number])) {
        conditions.push(eq(patientsTable.journeyStage, stage as typeof VALID_JOURNEY_STAGES[number]));
      }
      if (isLead !== undefined) {
        conditions.push(eq(patientsTable.isLead, isLead === "true"));
      }

      const limit = Math.min(parseInt(limitStr as string) || 50, 100);
      const offset = parseInt(offsetStr as string) || 0;

      const query = db
        .select({
          id: patientsTable.id,
          celljevityId: patientsTable.celljevityId,
          journeyStage: patientsTable.journeyStage,
          isLead: patientsTable.isLead,
          assignedCoordinatorId: patientsTable.assignedCoordinatorId,
          assignedProviderId: patientsTable.assignedProviderId,
          createdAt: patientsTable.createdAt,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          email: usersTable.email,
        })
        .from(patientsTable)
        .innerJoin(usersTable, eq(patientsTable.userId, usersTable.id));

      if (search && typeof search === "string") {
        conditions.push(
          sql`(${usersTable.firstName} ILIKE ${"%" + search + "%"} OR ${usersTable.lastName} ILIKE ${"%" + search + "%"} OR ${usersTable.email} ILIKE ${"%" + search + "%"} OR ${patientsTable.celljevityId} ILIKE ${"%" + search + "%"})` as ReturnType<typeof eq>
        );
      }

      const result = conditions.length > 0
        ? await query.where(and(...conditions)).limit(limit).offset(offset)
        : await query.limit(limit).offset(offset);

      const countQuery = db.select({ count: sql<number>`count(*)` }).from(patientsTable);
      if (conditions.length > 0) {
        const countWithJoin = db.select({ count: sql<number>`count(*)` }).from(patientsTable).innerJoin(usersTable, eq(patientsTable.userId, usersTable.id));
        const [{ count }] = await countWithJoin.where(and(...conditions));
        res.json({ data: result, total: Number(count), limit, offset });
      } else {
        const [{ count }] = await countQuery;
        res.json({ data: result, total: Number(count), limit, offset });
      }
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/patients/:patientId",
  requireAuth,
  requireSelfOrRole("patientId", "CARE_COORDINATOR", "MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("VIEW_PATIENT", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { patientId } = req.params;

      const [patient] = await db
        .select({
          id: patientsTable.id,
          userId: patientsTable.userId,
          celljevityId: patientsTable.celljevityId,
          dateOfBirth: patientsTable.dateOfBirth,
          phone: patientsTable.phone,
          address: patientsTable.address,
          journeyStage: patientsTable.journeyStage,
          medicalHistorySummary: patientsTable.medicalHistorySummary,
          assignedCoordinatorId: patientsTable.assignedCoordinatorId,
          assignedProviderId: patientsTable.assignedProviderId,
          isLead: patientsTable.isLead,
          createdAt: patientsTable.createdAt,
          updatedAt: patientsTable.updatedAt,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          email: usersTable.email,
        })
        .from(patientsTable)
        .innerJoin(usersTable, eq(patientsTable.userId, usersTable.id))
        .where(eq(patientsTable.id, patientId))
        .limit(1);

      if (!patient) {
        res.status(404).json({ error: "Patient not found" });
        return;
      }

      res.json(filterPatientByRole(patient as Record<string, unknown>, req.user!.role));
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/patients/:patientId",
  requireAuth,
  requireRole("CARE_COORDINATOR", "MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("UPDATE_PATIENT", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { patientId } = req.params;
      const updates: Partial<typeof patientsTable.$inferInsert> = { updatedAt: new Date() };

      if (req.body.journeyStage !== undefined && VALID_JOURNEY_STAGES.includes(req.body.journeyStage)) {
        updates.journeyStage = req.body.journeyStage;
      }
      if (req.body.isLead !== undefined) updates.isLead = req.body.isLead;
      if (req.body.assignedCoordinatorId !== undefined) updates.assignedCoordinatorId = req.body.assignedCoordinatorId;
      if (req.body.assignedProviderId !== undefined) updates.assignedProviderId = req.body.assignedProviderId;
      if (req.body.dateOfBirth !== undefined) updates.dateOfBirth = req.body.dateOfBirth;
      if (req.body.phone !== undefined) updates.phone = req.body.phone;
      if (req.body.address !== undefined) updates.address = req.body.address;

      if ((req.user?.role === "MEDICAL_PROVIDER" || req.user?.role === "SUPER_ADMIN") && req.body.medicalHistorySummary !== undefined) {
        updates.medicalHistorySummary = req.body.medicalHistorySummary;
      }

      const [updated] = await db
        .update(patientsTable)
        .set(updates)
        .where(eq(patientsTable.id, patientId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Patient not found" });
        return;
      }

      res.json(filterPatientByRole(updated as Record<string, unknown>, req.user!.role));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/patients",
  requireAuth,
  requireRole("CARE_COORDINATOR", "SUPER_ADMIN"),
  auditLog("CREATE_PATIENT"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { email, firstName, lastName, dateOfBirth, phone, address, journeyStage } = req.body;

      if (!email || !firstName || !lastName) {
        res.status(400).json({ error: "email, firstName, lastName are required" });
        return;
      }

      const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (existing.length > 0) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }

      const tempPassword = crypto.randomBytes(12).toString("base64url");
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      const [user] = await db.insert(usersTable).values({
        email,
        passwordHash,
        role: "PATIENT",
        firstName,
        lastName,
      }).returning();

      const celljevityId = `CELL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const [patient] = await db.insert(patientsTable).values({
        userId: user.id,
        celljevityId,
        dateOfBirth: dateOfBirth || null,
        phone: phone || null,
        address: address || null,
        journeyStage: journeyStage && VALID_JOURNEY_STAGES.includes(journeyStage) ? journeyStage : "ACQUISITION",
        isLead: false,
      }).returning();

      await db.insert(auditLogsTable).values({
        userId: req.user!.id,
        action: "PATIENT_CREATED",
        targetResourceType: "patient",
        targetResourceId: patient.id,
        details: JSON.stringify({ method: "POST", path: "/patients", createdBy: req.user!.id }),
        ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
      });

      res.status(201).json({
        ...patient,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        temporaryPassword: tempPassword,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/patients/:patientId",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  auditLog("DELETE_PATIENT", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [patient] = await db
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.id, req.params.patientId))
        .limit(1);

      if (!patient) {
        res.status(404).json({ error: "Patient not found" });
        return;
      }

      const quoteIds = await db
        .select({ id: quotesTable.id })
        .from(quotesTable)
        .where(eq(quotesTable.patientId, patient.id));

      for (const q of quoteIds) {
        await db.delete(invoiceLineItemsTable).where(eq(invoiceLineItemsTable.quoteId, q.id));
      }

      await db.delete(quotesTable).where(eq(quotesTable.patientId, patient.id));
      await db.delete(biomarkerResultsTable).where(eq(biomarkerResultsTable.patientId, patient.id));
      await db.delete(consentRecordsTable).where(eq(consentRecordsTable.patientId, patient.id));
      await db.delete(intakeFormsTable).where(eq(intakeFormsTable.patientId, patient.id));

      const patientDocs = await db.select().from(documentsTable).where(eq(documentsTable.patientId, patient.id));
      for (const doc of patientDocs) {
        await db.delete(documentTokensTable).where(eq(documentTokensTable.documentId, doc.id));
        try { await fs.unlink(path.join(UPLOAD_DIR, doc.storageKey)); } catch {}
        try { await fs.rmdir(path.dirname(path.join(UPLOAD_DIR, doc.storageKey))); } catch {}
      }
      await db.delete(documentsTable).where(eq(documentsTable.patientId, patient.id));

      await db.delete(leadsTable).where(eq(leadsTable.convertedPatientId, patient.id));
      await db.delete(patientsTable).where(eq(patientsTable.id, patient.id));

      const erasureId = crypto.randomUUID().slice(0, 8);
      await db.update(usersTable).set({
        email: `deleted_${erasureId}@removed.local`,
        passwordHash: "DELETED",
        firstName: "DELETED",
        lastName: "DELETED",
        isActive: false,
      }).where(eq(usersTable.id, patient.userId));

      res.json({ message: "Patient and all associated data deleted" });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/patients/me/profile",
  requireAuth,
  requireRole("PATIENT"),
  auditLog("VIEW_OWN_PROFILE"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [patient] = await db
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.userId, req.user!.id))
        .limit(1);

      if (!patient) {
        res.status(404).json({ error: "Patient profile not found" });
        return;
      }

      res.json(patient);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
