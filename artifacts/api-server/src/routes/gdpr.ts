import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  patientsTable, usersTable, documentsTable, documentTokensTable, intakeFormsTable,
  biomarkerResultsTable, consentRecordsTable, quotesTable,
  invoiceLineItemsTable, auditLogsTable, leadsTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, auditLog, type AuthenticatedRequest } from "../middlewares";

const router: IRouter = Router();

router.get(
  "/gdpr/export",
  requireAuth,
  auditLog("GDPR_DATA_EXPORT"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.id;

      const [patient] = await db
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.userId, userId))
        .limit(1);

      if (!patient) {
        res.status(404).json({ error: "No patient record found" });
        return;
      }

      const [user] = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          role: usersTable.role,
          createdAt: usersTable.createdAt,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      const documents = await db
        .select({
          id: documentsTable.id,
          documentType: documentsTable.documentType,
          fileName: documentsTable.fileName,
          uploadDate: documentsTable.uploadDate,
        })
        .from(documentsTable)
        .where(eq(documentsTable.patientId, patient.id));

      const intakeForm = await db
        .select()
        .from(intakeFormsTable)
        .where(eq(intakeFormsTable.patientId, patient.id))
        .limit(1);

      const biomarkers = await db
        .select()
        .from(biomarkerResultsTable)
        .where(eq(biomarkerResultsTable.patientId, patient.id));

      const consents = await db
        .select()
        .from(consentRecordsTable)
        .where(eq(consentRecordsTable.patientId, patient.id));

      const quotes = await db
        .select()
        .from(quotesTable)
        .where(eq(quotesTable.patientId, patient.id));

      res.json({
        exportDate: new Date().toISOString(),
        user,
        patient,
        documents,
        intakeForm: intakeForm[0] ?? null,
        biomarkers,
        consents,
        quotes,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/gdpr/delete",
  requireAuth,
  auditLog("GDPR_DATA_DELETION_REQUEST"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.id;

      const [patient] = await db
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.userId, userId))
        .limit(1);

      if (!patient) {
        res.status(404).json({ error: "No patient record found" });
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

      const patientDocs = await db.select({ id: documentsTable.id }).from(documentsTable).where(eq(documentsTable.patientId, patient.id));
      for (const doc of patientDocs) {
        await db.delete(documentTokensTable).where(eq(documentTokensTable.documentId, doc.id));
      }
      await db.delete(documentsTable).where(eq(documentsTable.patientId, patient.id));

      await db.delete(leadsTable).where(eq(leadsTable.convertedPatientId, patient.id));
      await db.delete(patientsTable).where(eq(patientsTable.id, patient.id));

      await db.insert(auditLogsTable).values({
        userId,
        action: "GDPR_DATA_DELETED",
        targetResourceType: "patient",
        targetResourceId: patient.id,
        details: JSON.stringify({ deletedAt: new Date().toISOString() }),
        ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
      });

      await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.id, userId));

      req.session.destroy(() => {});

      res.json({
        message: "All personal data has been deleted. Your account has been deactivated.",
        deletedResources: ["patient", "documents", "intakeForms", "biomarkers", "consents", "quotes"],
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
