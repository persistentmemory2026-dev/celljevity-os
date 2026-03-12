import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { consentRecordsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireSelfOrRole, auditLog, type AuthenticatedRequest } from "../middlewares";

const router: IRouter = Router();

router.get(
  "/patients/:patientId/consents",
  requireAuth,
  requireSelfOrRole("patientId", "CARE_COORDINATOR", "SUPER_ADMIN"),
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
  auditLog("GRANT_CONSENT", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { consentType, version, granted, jurisdiction } = req.body;

      if (!consentType) {
        res.status(400).json({ error: "consentType is required" });
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
      const [updated] = await db
        .update(consentRecordsTable)
        .set({
          granted: false,
          revokedAt: new Date(),
        })
        .where(eq(consentRecordsTable.id, req.params.consentId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Consent record not found" });
        return;
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
