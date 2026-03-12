import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { intakeFormsTable, patientsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireSelfOrRole, auditLog, type AuthenticatedRequest } from "../middlewares";

const router: IRouter = Router();

router.get(
  "/patients/:patientId/intake",
  requireAuth,
  requireSelfOrRole("patientId", "CARE_COORDINATOR", "MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("VIEW_INTAKE", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [form] = await db
        .select()
        .from(intakeFormsTable)
        .where(eq(intakeFormsTable.patientId, req.params.patientId))
        .limit(1);

      if (!form) {
        res.json(null);
        return;
      }

      if (req.user!.role === "CARE_COORDINATOR") {
        res.json({
          id: form.id,
          patientId: form.patientId,
          personalProfile: form.personalProfile,
          consentData: form.consentData,
          isComplete: form.isComplete,
          completedAt: form.completedAt,
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
        });
        return;
      }

      res.json(form);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/patients/:patientId/intake",
  requireAuth,
  requireSelfOrRole("patientId", "CARE_COORDINATOR", "SUPER_ADMIN"),
  auditLog("CREATE_INTAKE", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { personalProfile, medicalHistory, consentData } = req.body;

      const existing = await db
        .select({ id: intakeFormsTable.id })
        .from(intakeFormsTable)
        .where(eq(intakeFormsTable.patientId, req.params.patientId))
        .limit(1);

      if (existing.length > 0) {
        res.status(409).json({ error: "Intake form already exists for this patient" });
        return;
      }

      const [form] = await db.insert(intakeFormsTable).values({
        patientId: req.params.patientId,
        personalProfile,
        medicalHistory,
        consentData,
      }).returning();

      res.status(201).json(form);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/patients/:patientId/intake",
  requireAuth,
  requireSelfOrRole("patientId", "CARE_COORDINATOR", "SUPER_ADMIN"),
  auditLog("UPDATE_INTAKE", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { personalProfile, medicalHistory, consentData } = req.body;
      const updates: Partial<typeof intakeFormsTable.$inferInsert> = { updatedAt: new Date() };

      if (personalProfile !== undefined) updates.personalProfile = personalProfile;
      if (medicalHistory !== undefined) updates.medicalHistory = medicalHistory;
      if (consentData !== undefined) updates.consentData = consentData;

      const [updated] = await db
        .update(intakeFormsTable)
        .set(updates)
        .where(eq(intakeFormsTable.patientId, req.params.patientId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Intake form not found" });
        return;
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/patients/:patientId/intake/complete",
  requireAuth,
  requireSelfOrRole("patientId", "CARE_COORDINATOR", "SUPER_ADMIN"),
  auditLog("COMPLETE_INTAKE", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [form] = await db
        .update(intakeFormsTable)
        .set({
          isComplete: true,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(intakeFormsTable.patientId, req.params.patientId))
        .returning();

      if (!form) {
        res.status(404).json({ error: "Intake form not found" });
        return;
      }

      await db
        .update(patientsTable)
        .set({
          journeyStage: "DIAGNOSTICS",
          isLead: false,
          updatedAt: new Date(),
        })
        .where(eq(patientsTable.id, req.params.patientId));

      res.json(form);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
