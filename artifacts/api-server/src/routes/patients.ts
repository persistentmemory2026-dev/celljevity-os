import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, usersTable } from "@workspace/db/schema";
import { eq, ilike, and, sql } from "drizzle-orm";
import { requireAuth, requireRole, requireSelfOrRole, auditLog, type AuthenticatedRequest } from "../middlewares";

const router: IRouter = Router();

router.get(
  "/patients",
  requireAuth,
  requireRole("CARE_COORDINATOR", "MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("LIST_PATIENTS"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { stage, isLead, search, limit: limitStr, offset: offsetStr } = req.query;

      const conditions = [];
      if (stage && typeof stage === "string") {
        conditions.push(eq(patientsTable.journeyStage, stage as any));
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
          sql`(${usersTable.firstName} ILIKE ${'%' + search + '%'} OR ${usersTable.lastName} ILIKE ${'%' + search + '%'} OR ${usersTable.email} ILIKE ${'%' + search + '%'} OR ${patientsTable.celljevityId} ILIKE ${'%' + search + '%'})`
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

      const response: Record<string, unknown> = { ...patient };
      if (req.user?.role === "CARE_COORDINATOR") {
        delete response.medicalHistorySummary;
      }

      res.json(response);
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
      const updates: Record<string, unknown> = {};

      const allowedFields = [
        "journeyStage", "isLead", "assignedCoordinatorId",
        "assignedProviderId", "dateOfBirth", "phone", "address",
      ];

      if (req.user?.role === "MEDICAL_PROVIDER" || req.user?.role === "SUPER_ADMIN") {
        allowedFields.push("medicalHistorySummary");
      }

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      updates.updatedAt = new Date();

      const [updated] = await db
        .update(patientsTable)
        .set(updates as any)
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
