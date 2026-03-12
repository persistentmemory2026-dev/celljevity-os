import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { documentsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireSelfOrRole, auditLog, type AuthenticatedRequest } from "../middlewares";
import crypto from "crypto";

const router: IRouter = Router();

router.get(
  "/patients/:patientId/documents",
  requireAuth,
  requireSelfOrRole("patientId", "CARE_COORDINATOR", "MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("LIST_DOCUMENTS", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { documentType } = req.query;
      const conditions = [eq(documentsTable.patientId, req.params.patientId)];

      if (documentType && typeof documentType === "string") {
        conditions.push(eq(documentsTable.documentType, documentType as any));
      }

      const docs = await db.select().from(documentsTable).where(and(...conditions));
      res.json({ data: docs });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/patients/:patientId/documents",
  requireAuth,
  requireSelfOrRole("patientId", "CARE_COORDINATOR", "MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("UPLOAD_DOCUMENT", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { documentType, fileName, mimeType, fileSize } = req.body;

      if (!documentType || !fileName) {
        res.status(400).json({ error: "documentType and fileName are required" });
        return;
      }

      const storageKey = `patients/${req.params.patientId}/${crypto.randomUUID()}/${fileName}`;

      const [doc] = await db.insert(documentsTable).values({
        patientId: req.params.patientId,
        uploadedBy: req.user!.id,
        documentType,
        fileName,
        storageKey,
        mimeType,
        fileSize,
      }).returning();

      const signedUrl = `/api/documents/${doc.id}/upload?token=${crypto.randomBytes(32).toString("hex")}&expires=${Date.now() + 3600000}`;

      res.status(201).json({
        document: doc,
        uploadUrl: signedUrl,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/documents/:documentId/download",
  requireAuth,
  auditLog("DOWNLOAD_DOCUMENT", (req) => ({ type: "document", id: req.params.documentId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [doc] = await db
        .select()
        .from(documentsTable)
        .where(eq(documentsTable.id, req.params.documentId))
        .limit(1);

      if (!doc) {
        res.status(404).json({ error: "Document not found" });
        return;
      }

      const signedUrl = `/storage/${doc.storageKey}?token=${crypto.randomBytes(32).toString("hex")}&expires=${Date.now() + 900000}`;

      res.json({
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        downloadUrl: signedUrl,
        expiresIn: 900,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/documents/:documentId",
  requireAuth,
  auditLog("DELETE_DOCUMENT", (req) => ({ type: "document", id: req.params.documentId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [deleted] = await db
        .delete(documentsTable)
        .where(eq(documentsTable.id, req.params.documentId))
        .returning();

      if (!deleted) {
        res.status(404).json({ error: "Document not found" });
        return;
      }

      res.json({ message: "Document deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
