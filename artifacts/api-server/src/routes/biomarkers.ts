import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { biomarkerResultsTable, biomarkerTypeEnum, biomarkerStatusEnum, patientsTable } from "@workspace/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { requireAuth, requireSelfOrRole, requireRole, requireAssignedOrAdmin, checkStaffAssignment, auditLog, logSecurityEvent, type AuthenticatedRequest } from "../middlewares";

const router: IRouter = Router();
const VALID_BIOMARKER_TYPES = biomarkerTypeEnum.enumValues;
const VALID_STATUS_FLAGS = biomarkerStatusEnum.enumValues;

router.get(
  "/patients/:patientId/biomarkers",
  requireAuth,
  requireSelfOrRole("patientId", "CARE_COORDINATOR", "MEDICAL_PROVIDER", "SUPER_ADMIN"),
  requireAssignedOrAdmin("patientId"),
  auditLog("LIST_BIOMARKERS", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { type, from, to } = req.query;
      const conditions = [eq(biomarkerResultsTable.patientId, req.params.patientId)];

      if (type && typeof type === "string" && VALID_BIOMARKER_TYPES.includes(type as typeof VALID_BIOMARKER_TYPES[number])) {
        conditions.push(eq(biomarkerResultsTable.biomarkerType, type as typeof VALID_BIOMARKER_TYPES[number]));
      }
      if (from && typeof from === "string") {
        conditions.push(gte(biomarkerResultsTable.testDate, from));
      }
      if (to && typeof to === "string") {
        conditions.push(lte(biomarkerResultsTable.testDate, to));
      }

      const results = await db
        .select()
        .from(biomarkerResultsTable)
        .where(and(...conditions))
        .orderBy(desc(biomarkerResultsTable.testDate));

      const role = req.user!.role;
      const filtered = results.map((r) => {
        if (role === "PATIENT" || role === "CARE_COORDINATOR") {
          return {
            id: r.id,
            testDate: r.testDate,
            biomarkerType: r.biomarkerType,
            valueNumeric: r.valueNumeric,
            unit: r.unit,
            referenceRangeMin: r.referenceRangeMin,
            referenceRangeMax: r.referenceRangeMax,
            statusFlag: r.statusFlag,
            createdAt: r.createdAt,
          };
        }
        return r;
      });

      res.json({ data: filtered });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/biomarkers/:biomarkerId",
  requireAuth,
  auditLog("VIEW_BIOMARKER", (req) => ({ type: "biomarker", id: req.params.biomarkerId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [result] = await db
        .select()
        .from(biomarkerResultsTable)
        .where(eq(biomarkerResultsTable.id, req.params.biomarkerId))
        .limit(1);

      if (!result) {
        res.status(404).json({ error: "Biomarker result not found" });
        return;
      }

      if (req.user!.role === "PATIENT") {
        const [patient] = await db
          .select({ id: patientsTable.id })
          .from(patientsTable)
          .where(
            and(
              eq(patientsTable.id, result.patientId),
              eq(patientsTable.userId, req.user!.id)
            )
          )
          .limit(1);

        if (!patient) {
          await logSecurityEvent("PERMISSION_DENIED", { userId: req.user!.id, reason: "patient_biomarker_access_denied", biomarkerId: req.params.biomarkerId }, req);
          res.status(403).json({ error: "Access denied" });
          return;
        }

        res.json({
          id: result.id,
          testDate: result.testDate,
          biomarkerType: result.biomarkerType,
          valueNumeric: result.valueNumeric,
          unit: result.unit,
          referenceRangeMin: result.referenceRangeMin,
          referenceRangeMax: result.referenceRangeMax,
          statusFlag: result.statusFlag,
          createdAt: result.createdAt,
        });
        return;
      }

      const isAssigned = await checkStaffAssignment(req.user!.id, req.user!.role, result.patientId);
      if (!isAssigned) {
        await logSecurityEvent("PERMISSION_DENIED", { userId: req.user!.id, reason: "staff_not_assigned_biomarker", biomarkerId: req.params.biomarkerId }, req);
        res.status(403).json({ error: "You are not assigned to this patient" });
        return;
      }

      if (req.user!.role === "CARE_COORDINATOR") {
        res.json({
          id: result.id,
          patientId: result.patientId,
          testDate: result.testDate,
          biomarkerType: result.biomarkerType,
          valueNumeric: result.valueNumeric,
          unit: result.unit,
          referenceRangeMin: result.referenceRangeMin,
          referenceRangeMax: result.referenceRangeMax,
          statusFlag: result.statusFlag,
          createdAt: result.createdAt,
        });
        return;
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/patients/:patientId/biomarkers",
  requireAuth,
  requireRole("MEDICAL_PROVIDER", "SUPER_ADMIN"),
  requireAssignedOrAdmin("patientId"),
  auditLog("ADD_BIOMARKER", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { testDate, biomarkerType, valueNumeric, unit, referenceRangeMin, referenceRangeMax } = req.body;

      if (!testDate || !biomarkerType || valueNumeric === undefined || !unit) {
        res.status(400).json({ error: "testDate, biomarkerType, valueNumeric, unit are required" });
        return;
      }

      if (!VALID_BIOMARKER_TYPES.includes(biomarkerType)) {
        res.status(400).json({ error: `Invalid biomarkerType. Must be one of: ${VALID_BIOMARKER_TYPES.join(", ")}` });
        return;
      }

      let statusFlag: typeof VALID_STATUS_FLAGS[number] = "NORMAL";
      const val = parseFloat(valueNumeric);
      const min = referenceRangeMin !== undefined ? parseFloat(referenceRangeMin) : null;
      const max = referenceRangeMax !== undefined ? parseFloat(referenceRangeMax) : null;

      if (min !== null && max !== null) {
        const range = max - min;
        if (val < min || val > max) {
          const deviation = val < min ? (min - val) / range : (val - max) / range;
          statusFlag = deviation > 0.5 ? "CRITICAL" : "WARNING";
        } else {
          const midpoint = (min + max) / 2;
          const optimalRange = range * 0.25;
          statusFlag = Math.abs(val - midpoint) <= optimalRange ? "OPTIMAL" : "NORMAL";
        }
      }

      const [result] = await db.insert(biomarkerResultsTable).values({
        patientId: req.params.patientId,
        testDate,
        biomarkerType,
        valueNumeric: String(valueNumeric),
        unit,
        referenceRangeMin: referenceRangeMin !== undefined ? String(referenceRangeMin) : null,
        referenceRangeMax: referenceRangeMax !== undefined ? String(referenceRangeMax) : null,
        statusFlag,
        enteredBy: req.user!.id,
      }).returning();

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/biomarkers/:biomarkerId",
  requireAuth,
  requireRole("MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("UPDATE_BIOMARKER", (req) => ({ type: "biomarker", id: req.params.biomarkerId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [existing_check] = await db
        .select({ patientId: biomarkerResultsTable.patientId })
        .from(biomarkerResultsTable)
        .where(eq(biomarkerResultsTable.id, req.params.biomarkerId))
        .limit(1);

      if (!existing_check) {
        res.status(404).json({ error: "Biomarker result not found" });
        return;
      }

      const isAssigned = await checkStaffAssignment(req.user!.id, req.user!.role, existing_check.patientId);
      if (!isAssigned) {
        await logSecurityEvent("PERMISSION_DENIED", { userId: req.user!.id, reason: "staff_not_assigned_biomarker_update", biomarkerId: req.params.biomarkerId }, req);
        res.status(403).json({ error: "You are not assigned to this patient" });
        return;
      }

      const updates: Partial<typeof biomarkerResultsTable.$inferInsert> = {};

      if (req.body.testDate !== undefined) updates.testDate = req.body.testDate;
      if (req.body.biomarkerType !== undefined && VALID_BIOMARKER_TYPES.includes(req.body.biomarkerType)) {
        updates.biomarkerType = req.body.biomarkerType;
      }
      if (req.body.unit !== undefined) updates.unit = req.body.unit;
      if (req.body.valueNumeric !== undefined) updates.valueNumeric = String(req.body.valueNumeric);
      if (req.body.referenceRangeMin !== undefined) updates.referenceRangeMin = String(req.body.referenceRangeMin);
      if (req.body.referenceRangeMax !== undefined) updates.referenceRangeMax = String(req.body.referenceRangeMax);

      if (req.body.statusFlag !== undefined && VALID_STATUS_FLAGS.includes(req.body.statusFlag)) {
        updates.statusFlag = req.body.statusFlag;
      } else if (updates.valueNumeric !== undefined || updates.referenceRangeMin !== undefined || updates.referenceRangeMax !== undefined) {
        const [existing] = await db
          .select()
          .from(biomarkerResultsTable)
          .where(eq(biomarkerResultsTable.id, req.params.biomarkerId))
          .limit(1);

        if (existing) {
          const val = parseFloat(updates.valueNumeric ?? existing.valueNumeric);
          const min = updates.referenceRangeMin !== undefined ? parseFloat(updates.referenceRangeMin) : (existing.referenceRangeMin ? parseFloat(existing.referenceRangeMin) : null);
          const max = updates.referenceRangeMax !== undefined ? parseFloat(updates.referenceRangeMax) : (existing.referenceRangeMax ? parseFloat(existing.referenceRangeMax) : null);

          if (min !== null && max !== null) {
            const range = max - min;
            if (val < min || val > max) {
              const deviation = val < min ? (min - val) / range : (val - max) / range;
              updates.statusFlag = deviation > 0.5 ? "CRITICAL" : "WARNING";
            } else {
              const midpoint = (min + max) / 2;
              const optimalRange = range * 0.25;
              updates.statusFlag = Math.abs(val - midpoint) <= optimalRange ? "OPTIMAL" : "NORMAL";
            }
          }
        }
      }

      const [updated] = await db
        .update(biomarkerResultsTable)
        .set(updates)
        .where(eq(biomarkerResultsTable.id, req.params.biomarkerId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Biomarker result not found" });
        return;
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/biomarkers/:biomarkerId",
  requireAuth,
  requireRole("MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("DELETE_BIOMARKER", (req) => ({ type: "biomarker", id: req.params.biomarkerId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [biomarker] = await db
        .select({ patientId: biomarkerResultsTable.patientId })
        .from(biomarkerResultsTable)
        .where(eq(biomarkerResultsTable.id, req.params.biomarkerId))
        .limit(1);

      if (!biomarker) {
        res.status(404).json({ error: "Biomarker result not found" });
        return;
      }

      const isAssigned = await checkStaffAssignment(req.user!.id, req.user!.role, biomarker.patientId);
      if (!isAssigned) {
        await logSecurityEvent("PERMISSION_DENIED", { userId: req.user!.id, reason: "staff_not_assigned_biomarker_delete", biomarkerId: req.params.biomarkerId }, req);
        res.status(403).json({ error: "You are not assigned to this patient" });
        return;
      }

      await db
        .delete(biomarkerResultsTable)
        .where(eq(biomarkerResultsTable.id, req.params.biomarkerId));

      res.json({ message: "Biomarker result deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
