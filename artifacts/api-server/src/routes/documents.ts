import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { documentsTable, documentTokensTable, patientsTable, documentTypeEnum, auditLogsTable } from "@workspace/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { requireAuth, requireSelfOrRole, auditLog, type AuthenticatedRequest } from "../middlewares";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";

const router: IRouter = Router();
const UPLOAD_DIR = path.resolve(process.cwd(), ".data/uploads");
const UPLOAD_TOKEN_TTL_MS = 60 * 60 * 1000;
const DOWNLOAD_TOKEN_TTL_MS = 15 * 60 * 1000;
const VALID_DOC_TYPES = documentTypeEnum.enumValues;

function sanitizeFileName(fileName: string): string {
  const basename = path.basename(fileName);
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!sanitized || sanitized.startsWith(".")) {
    return `file_${crypto.randomUUID()}`;
  }
  return sanitized;
}

function ensurePathWithinUploadDir(filePath: string): void {
  const resolved = path.resolve(filePath);
  const resolvedUploadDir = path.resolve(UPLOAD_DIR);
  if (!resolved.startsWith(resolvedUploadDir + path.sep) && resolved !== resolvedUploadDir) {
    throw new Error("Path traversal attempt detected");
  }
}

async function ensureUploadDir(subDir: string) {
  const dir = path.join(UPLOAD_DIR, subDir);
  ensurePathWithinUploadDir(dir);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

router.get(
  "/patients/:patientId/documents",
  requireAuth,
  requireSelfOrRole("patientId", "CARE_COORDINATOR", "MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("LIST_DOCUMENTS", (req) => ({ type: "patient", id: req.params.patientId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { documentType } = req.query;
      const conditions = [eq(documentsTable.patientId, req.params.patientId)];

      if (documentType && typeof documentType === "string" && VALID_DOC_TYPES.includes(documentType as typeof VALID_DOC_TYPES[number])) {
        conditions.push(eq(documentsTable.documentType, documentType as typeof VALID_DOC_TYPES[number]));
      }

      const docs = await db.select().from(documentsTable).where(and(...conditions));

      const role = req.user!.role;
      const filtered = docs.map((doc) => {
        if (role === "PATIENT") {
          return {
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            mimeType: doc.mimeType,
            fileSize: doc.fileSize,
            uploadDate: doc.uploadDate,
          };
        }
        return {
          id: doc.id,
          patientId: doc.patientId,
          uploadedBy: doc.uploadedBy,
          documentType: doc.documentType,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize,
          uploadDate: doc.uploadDate,
        };
      });

      res.json({ data: filtered });
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

      if (!VALID_DOC_TYPES.includes(documentType)) {
        res.status(400).json({ error: `Invalid documentType. Must be one of: ${VALID_DOC_TYPES.join(", ")}` });
        return;
      }

      const safeFileName = sanitizeFileName(fileName);
      const fileId = crypto.randomUUID();
      const storageKey = `patients/${req.params.patientId}/${fileId}/${safeFileName}`;

      const [doc] = await db.insert(documentsTable).values({
        patientId: req.params.patientId,
        uploadedBy: req.user!.id,
        documentType,
        fileName,
        storageKey,
        mimeType,
        fileSize,
      }).returning();

      const token = crypto.randomBytes(48).toString("base64url");
      const expiresAt = new Date(Date.now() + UPLOAD_TOKEN_TTL_MS);

      await db.insert(documentTokensTable).values({
        documentId: doc.id,
        token,
        purpose: "upload",
        issuedTo: req.user!.id,
        expiresAt,
      });

      res.status(201).json({
        document: {
          id: doc.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          storageKey: doc.storageKey,
        },
        uploadUrl: `/api/documents/${doc.id}/upload`,
        uploadToken: token,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/documents/:documentId/upload",
  requireAuth,
  auditLog("EXECUTE_UPLOAD", (req) => ({ type: "document", id: req.params.documentId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { documentId } = req.params;
      const uploadToken = req.headers["x-upload-token"] as string;

      if (!uploadToken) {
        res.status(400).json({ error: "Missing x-upload-token header" });
        return;
      }

      const [tokenRecord] = await db
        .select()
        .from(documentTokensTable)
        .where(
          and(
            eq(documentTokensTable.documentId, documentId),
            eq(documentTokensTable.token, uploadToken),
            eq(documentTokensTable.purpose, "upload"),
            eq(documentTokensTable.issuedTo, req.user!.id),
            gt(documentTokensTable.expiresAt, new Date()),
            isNull(documentTokensTable.usedAt)
          )
        )
        .limit(1);

      if (!tokenRecord) {
        res.status(403).json({ error: "Invalid, expired, or already-used upload token" });
        return;
      }

      const [doc] = await db
        .select()
        .from(documentsTable)
        .where(eq(documentsTable.id, documentId))
        .limit(1);

      if (!doc) {
        res.status(404).json({ error: "Document not found" });
        return;
      }

      const subDir = path.dirname(doc.storageKey);
      const dir = await ensureUploadDir(subDir);
      const filePath = path.join(dir, path.basename(doc.storageKey));

      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const fileBuffer = Buffer.concat(chunks);
      await fs.writeFile(filePath, fileBuffer);

      await db
        .update(documentTokensTable)
        .set({ usedAt: new Date() })
        .where(eq(documentTokensTable.id, tokenRecord.id));

      await db
        .update(documentsTable)
        .set({ fileSize: fileBuffer.length })
        .where(eq(documentsTable.id, documentId));

      res.json({ message: "File uploaded successfully", fileSize: fileBuffer.length });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/documents/:documentId/download",
  requireAuth,
  auditLog("REQUEST_DOWNLOAD", (req) => ({ type: "document", id: req.params.documentId })),
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

      if (req.user!.role === "PATIENT") {
        const [patient] = await db
          .select({ id: patientsTable.id })
          .from(patientsTable)
          .where(
            and(
              eq(patientsTable.id, doc.patientId),
              eq(patientsTable.userId, req.user!.id)
            )
          )
          .limit(1);

        if (!patient) {
          res.status(403).json({ error: "Access denied" });
          return;
        }
      }

      const token = crypto.randomBytes(48).toString("base64url");
      const expiresAt = new Date(Date.now() + DOWNLOAD_TOKEN_TTL_MS);

      await db.insert(documentTokensTable).values({
        documentId: doc.id,
        token,
        purpose: "download",
        issuedTo: req.user!.id,
        expiresAt,
      });

      res.json({
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        downloadUrl: `/api/documents/${doc.id}/content`,
        downloadToken: token,
        expiresIn: DOWNLOAD_TOKEN_TTL_MS / 1000,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/documents/:documentId/content",
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const downloadToken = (req.headers["x-download-token"] as string) || (req.query.token as string);

      if (!downloadToken) {
        res.status(400).json({ error: "Missing download token (x-download-token header or ?token= query param)" });
        return;
      }

      const { documentId } = req.params;

      const [tokenRecord] = await db
        .select()
        .from(documentTokensTable)
        .where(
          and(
            eq(documentTokensTable.documentId, documentId),
            eq(documentTokensTable.token, downloadToken),
            eq(documentTokensTable.purpose, "download"),
            eq(documentTokensTable.issuedTo, req.user!.id),
            gt(documentTokensTable.expiresAt, new Date()),
            isNull(documentTokensTable.usedAt)
          )
        )
        .limit(1);

      if (!tokenRecord) {
        res.status(403).json({ error: "Invalid, expired, or already-used download token" });
        return;
      }

      const [doc] = await db
        .select()
        .from(documentsTable)
        .where(eq(documentsTable.id, documentId))
        .limit(1);

      if (!doc) {
        res.status(404).json({ error: "Document not found" });
        return;
      }

      await db
        .update(documentTokensTable)
        .set({ usedAt: new Date() })
        .where(eq(documentTokensTable.id, tokenRecord.id));

      db.insert(auditLogsTable)
        .values({
          userId: tokenRecord.issuedTo,
          action: "DOWNLOAD_DOCUMENT_CONTENT",
          targetResourceType: "document",
          targetResourceId: doc.id,
          details: JSON.stringify({
            method: req.method,
            path: req.originalUrl,
            fileName: doc.fileName,
          }),
          ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
        })
        .execute()
        .catch((err: unknown) => console.error("Audit log error:", err));

      const filePath = path.join(UPLOAD_DIR, doc.storageKey);

      try {
        ensurePathWithinUploadDir(filePath);
      } catch {
        res.status(403).json({ error: "Invalid storage path" });
        return;
      }

      try {
        await fs.access(filePath);
      } catch {
        res.status(404).json({ error: "File not found on disk" });
        return;
      }

      const safeDisplayName = sanitizeFileName(doc.fileName);
      res.setHeader("Content-Disposition", `attachment; filename="${safeDisplayName}"`);
      if (doc.mimeType) {
        res.setHeader("Content-Type", doc.mimeType);
      }

      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
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
      const [doc] = await db
        .select()
        .from(documentsTable)
        .where(eq(documentsTable.id, req.params.documentId))
        .limit(1);

      if (!doc) {
        res.status(404).json({ error: "Document not found" });
        return;
      }

      if (req.user!.role === "PATIENT") {
        const [patient] = await db
          .select({ id: patientsTable.id })
          .from(patientsTable)
          .where(
            and(
              eq(patientsTable.id, doc.patientId),
              eq(patientsTable.userId, req.user!.id)
            )
          )
          .limit(1);

        if (!patient) {
          res.status(403).json({ error: "Access denied" });
          return;
        }
      } else if (req.user!.role !== "SUPER_ADMIN" && req.user!.role !== "MEDICAL_PROVIDER" && req.user!.role !== "CARE_COORDINATOR") {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }

      const filePath = path.join(UPLOAD_DIR, doc.storageKey);
      try {
        await fs.unlink(filePath);
      } catch {
        // file may not exist on disk yet
      }

      await db.delete(documentTokensTable).where(eq(documentTokensTable.documentId, doc.id));
      await db.delete(documentsTable).where(eq(documentsTable.id, doc.id));

      res.json({ message: "Document deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
