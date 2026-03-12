import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { biomarkerResultsTable, biomarkerTypeEnum, biomarkerStatusEnum } from "@workspace/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { requireAuth, requireSelfOrRole, requireRole, auditLog, type AuthenticatedRequest } from "../middlewares";

const router: IRouter = Router();
const VALID_BIOMARKER_TYPES = biomarkerTypeEnum.enumValues;
const VALID_STATUS_FLAGS = biomarkerStatusEnum.enumValues;

router.get(
  "/patients/:patientId/biomarkers",
  requireAuth,
  requireSelfOrRole("patientId", "CARE_COORDINATOR", "MEDICAL_PROVIDER", "SUPER_ADMIN"),
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

router.post(
  "/patients/:patientId/biomarkers",
  requireAuth,
  requireRole("MEDICAL_PROVIDER", "SUPER_ADMIN"),
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

router.delete(
  "/biomarkers/:biomarkerId",
  requireAuth,
  requireRole("MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("DELETE_BIOMARKER", (req) => ({ type: "biomarker", id: req.params.biomarkerId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [deleted] = await db
        .delete(biomarkerResultsTable)
        .where(eq(biomarkerResultsTable.id, req.params.biomarkerId))
        .returning();

      if (!deleted) {
        res.status(404).json({ error: "Biomarker result not found" });
        return;
      }

      res.json({ message: "Biomarker result deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
