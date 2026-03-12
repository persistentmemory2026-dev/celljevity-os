import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { consentRecordsTable, patientsTable, consentTypeEnum } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireSelfOrRole, requireAssignedOrAdmin, auditLog, logSecurityEvent, type AuthenticatedRequest } from "../middlewares";

const router: IRouter = Router();
const VALID_CONSENT_TYPES = consentTypeEnum.enumValues;

router.get(
  "/patients/:patientId/consents",
  requireAuth,
  requireSelfOrRole("patientId", "CARE_COORDINATOR", "SUPER_ADMIN"),
  requireAssignedOrAdmin("patientId"),
  auditLog("LIST_CONSENTS", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const consents = await db
        .select()
        .from(consentRecordsTable)
        .where(eq(consentRecordsTable.patientId, req.params.patientId));

      res.json({ data: consents });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/patients/:patientId/consents",
  requireAuth,
  requireSelfOrRole("patientId", "CARE_COORDINATOR", "SUPER_ADMIN"),
  requireAssignedOrAdmin("patientId"),
  auditLog("GRANT_CONSENT", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { consentType, version, granted, jurisdiction } = req.body;

      if (!consentType) {
        res.status(400).json({ error: "consentType is required" });
        return;
      }

      if (!VALID_CONSENT_TYPES.includes(consentType)) {
        res.status(400).json({ error: `Invalid consentType. Must be one of: ${VALID_CONSENT_TYPES.join(", ")}` });
        return;
      }

      const [record] = await db.insert(consentRecordsTable).values({
        patientId: req.params.patientId,
        consentType,
        version: version || "1.0",
        granted: granted ?? true,
        ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
        jurisdiction,
        grantedAt: granted !== false ? new Date() : null,
      }).returning();

      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/consents/:consentId/revoke",
  requireAuth,
  auditLog("REVOKE_CONSENT", (req) => ({ type: "consent", id: req.params.consentId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [consent] = await db
        .select()
        .from(consentRecordsTable)
        .where(eq(consentRecordsTable.id, req.params.consentId))
        .limit(1);

      if (!consent) {
        res.status(404).json({ error: "Consent record not found" });
        return;
      }

      if (req.user!.role === "PATIENT") {
        const [patient] = await db
          .select({ id: patientsTable.id })
          .from(patientsTable)
          .where(
            and(
              eq(patientsTable.id, consent.patientId),
              eq(patientsTable.userId, req.user!.id)
            )
          )
          .limit(1);

        if (!patient) {
          await logSecurityEvent("PERMISSION_DENIED", { userId: req.user!.id, reason: "patient_consent_revoke_denied", consentId: req.params.consentId }, req);
          res.status(403).json({ error: "Access denied" });
          return;
        }
      } else if (req.user!.role !== "CARE_COORDINATOR" && req.user!.role !== "SUPER_ADMIN") {
        await logSecurityEvent("PERMISSION_DENIED", { userId: req.user!.id, userRole: req.user!.role, reason: "consent_revoke_insufficient_permissions", consentId: req.params.consentId }, req);
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }

      const [updated] = await db
        .update(consentRecordsTable)
        .set({
          granted: false,
          revokedAt: new Date(),
        })
        .where(eq(consentRecordsTable.id, req.params.consentId))
        .returning();

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
