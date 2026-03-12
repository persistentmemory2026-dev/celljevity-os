import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, usersTable, journeyStageEnum } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireRole, requireSelfOrRole, auditLog, type AuthenticatedRequest } from "../middlewares";

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

      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(patientsTable);

      res.json({ data: result, total: Number(count), limit, offset });
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

      res.json(updated);
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
