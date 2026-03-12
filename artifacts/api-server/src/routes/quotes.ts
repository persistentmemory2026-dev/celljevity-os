import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { quotesTable, invoiceLineItemsTable, serviceCatalogTable, quoteStatusEnum, patientsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireRole, checkStaffAssignment, auditLog, logSecurityEvent, type AuthenticatedRequest } from "../middlewares";

const router: IRouter = Router();
const VALID_QUOTE_STATUSES = quoteStatusEnum.enumValues;

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${y}${m}${d}-${rand}`;
}

router.get(
  "/quotes",
  requireAuth,
  auditLog("LIST_QUOTES"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { patientId, status, limit: limitStr, offset: offsetStr } = req.query;
      const role = req.user!.role;

      if (role === "PATIENT") {
        const [patient] = await db
          .select({ id: patientsTable.id })
          .from(patientsTable)
          .where(eq(patientsTable.userId, req.user!.id))
          .limit(1);

        if (!patient) {
          res.json({ data: [], limit: 50, offset: 0 });
          return;
        }

        const quotes = await db
          .select({
            id: quotesTable.id,
            invoiceNumber: quotesTable.invoiceNumber,
            status: quotesTable.status,
            issueDate: quotesTable.issueDate,
            currency: quotesTable.currency,
            totalAmount: quotesTable.totalAmount,
            createdAt: quotesTable.createdAt,
          })
          .from(quotesTable)
          .where(eq(quotesTable.patientId, patient.id));

        res.json({ data: quotes, limit: quotes.length, offset: 0 });
        return;
      }

      const conditions: ReturnType<typeof eq>[] = [];

      if (patientId && typeof patientId === "string") {
        conditions.push(eq(quotesTable.patientId, patientId));
      }
      if (status && typeof status === "string" && VALID_QUOTE_STATUSES.includes(status as typeof VALID_QUOTE_STATUSES[number])) {
        conditions.push(eq(quotesTable.status, status as typeof VALID_QUOTE_STATUSES[number]));
      }

      if (role === "CARE_COORDINATOR") {
        conditions.push(eq(patientsTable.assignedCoordinatorId, req.user!.id));
      } else if (role === "MEDICAL_PROVIDER") {
        conditions.push(eq(patientsTable.assignedProviderId, req.user!.id));
      }

      const limit = Math.min(parseInt(limitStr as string) || 50, 100);
      const offset = parseInt(offsetStr as string) || 0;

      const needsJoin = role === "CARE_COORDINATOR" || role === "MEDICAL_PROVIDER";
      const query = needsJoin
        ? db.select({
            id: quotesTable.id,
            invoiceNumber: quotesTable.invoiceNumber,
            patientId: quotesTable.patientId,
            createdBy: quotesTable.createdBy,
            status: quotesTable.status,
            issueDate: quotesTable.issueDate,
            currency: quotesTable.currency,
            exchangeRateUsed: quotesTable.exchangeRateUsed,
            totalAmount: quotesTable.totalAmount,
            notesAndTerms: quotesTable.notesAndTerms,
            createdAt: quotesTable.createdAt,
            updatedAt: quotesTable.updatedAt,
          }).from(quotesTable).innerJoin(patientsTable, eq(quotesTable.patientId, patientsTable.id))
        : db.select().from(quotesTable);
      const result = conditions.length > 0
        ? await query.where(and(...conditions)).limit(limit).offset(offset)
        : await query.limit(limit).offset(offset);

      res.json({ data: result, limit, offset });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/quotes/:quoteId",
  requireAuth,
  auditLog("VIEW_QUOTE", (req) => ({ type: "quote", id: req.params.quoteId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [quote] = await db
        .select()
        .from(quotesTable)
        .where(eq(quotesTable.id, req.params.quoteId))
        .limit(1);

      if (!quote) {
        res.status(404).json({ error: "Quote not found" });
        return;
      }

      if (req.user!.role === "PATIENT") {
        const [patient] = await db
          .select({ id: patientsTable.id })
          .from(patientsTable)
          .where(
            and(
              eq(patientsTable.id, quote.patientId),
              eq(patientsTable.userId, req.user!.id)
            )
          )
          .limit(1);

        if (!patient) {
          await logSecurityEvent("PERMISSION_DENIED", { userId: req.user!.id, reason: "patient_quote_access_denied", quoteId: req.params.quoteId }, req);
          res.status(403).json({ error: "Access denied" });
          return;
        }
      } else {
        const isAssigned = await checkStaffAssignment(req.user!.id, req.user!.role, quote.patientId);
        if (!isAssigned) {
          await logSecurityEvent("PERMISSION_DENIED", { userId: req.user!.id, reason: "staff_not_assigned_quote", quoteId: req.params.quoteId }, req);
          res.status(403).json({ error: "You are not assigned to this patient" });
          return;
        }
      }

      const lineItems = await db
        .select({
          id: invoiceLineItemsTable.id,
          serviceId: invoiceLineItemsTable.serviceId,
          customDescription: invoiceLineItemsTable.customDescription,
          quantity: invoiceLineItemsTable.quantity,
          unitPrice: invoiceLineItemsTable.unitPrice,
          lineTotal: invoiceLineItemsTable.lineTotal,
          serviceName: serviceCatalogTable.name,
          serviceCategory: serviceCatalogTable.category,
        })
        .from(invoiceLineItemsTable)
        .leftJoin(serviceCatalogTable, eq(invoiceLineItemsTable.serviceId, serviceCatalogTable.id))
        .where(eq(invoiceLineItemsTable.quoteId, quote.id));

      if (req.user!.role === "PATIENT") {
        res.json({
          id: quote.id,
          invoiceNumber: quote.invoiceNumber,
          status: quote.status,
          issueDate: quote.issueDate,
          currency: quote.currency,
          totalAmount: quote.totalAmount,
          notesAndTerms: quote.notesAndTerms,
          createdAt: quote.createdAt,
          lineItems,
        });
        return;
      }

      res.json({ ...quote, lineItems });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/quotes",
  requireAuth,
  requireRole("CARE_COORDINATOR", "SUPER_ADMIN"),
  auditLog("CREATE_QUOTE"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { patientId, currency, exchangeRateUsed, notesAndTerms, issueDate } = req.body;

      if (!patientId) {
        res.status(400).json({ error: "patientId is required" });
        return;
      }

      const isAssigned = await checkStaffAssignment(req.user!.id, req.user!.role, patientId);
      if (!isAssigned) {
        await logSecurityEvent("PERMISSION_DENIED", { userId: req.user!.id, reason: "staff_not_assigned_create_quote", patientId }, req);
        res.status(403).json({ error: "You are not assigned to this patient" });
        return;
      }

      const [quote] = await db.insert(quotesTable).values({
        invoiceNumber: generateInvoiceNumber(),
        patientId,
        createdBy: req.user!.id,
        issueDate: issueDate || new Date().toISOString().split("T")[0],
        currency: currency || "EUR",
        exchangeRateUsed: String(exchangeRateUsed || "1.000000"),
        notesAndTerms,
      }).returning();

      res.status(201).json(quote);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/quotes/:quoteId",
  requireAuth,
  requireRole("CARE_COORDINATOR", "SUPER_ADMIN"),
  auditLog("UPDATE_QUOTE", (req) => ({ type: "quote", id: req.params.quoteId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [quoteCheck] = await db
        .select({ patientId: quotesTable.patientId, status: quotesTable.status })
        .from(quotesTable)
        .where(eq(quotesTable.id, req.params.quoteId))
        .limit(1);

      if (!quoteCheck) {
        res.status(404).json({ error: "Quote not found" });
        return;
      }

      const isAssigned = await checkStaffAssignment(req.user!.id, req.user!.role, quoteCheck.patientId);
      if (!isAssigned) {
        await logSecurityEvent("PERMISSION_DENIED", { userId: req.user!.id, reason: "staff_not_assigned_quote_update", quoteId: req.params.quoteId }, req);
        res.status(403).json({ error: "You are not assigned to this patient" });
        return;
      }

      const updates: Partial<typeof quotesTable.$inferInsert> = { updatedAt: new Date() };

      if (req.body.status !== undefined && VALID_QUOTE_STATUSES.includes(req.body.status)) {
        const allowedTransitions: Record<string, string[]> = {
          DRAFT: ["PENDING", "CANCELLED"],
          PENDING: ["ACCEPTED", "CANCELLED"],
          ACCEPTED: ["PAID", "CANCELLED"],
          PAID: [],
          CANCELLED: [],
        };

        const allowed = allowedTransitions[quoteCheck.status] || [];
        if (!allowed.includes(req.body.status)) {
          res.status(400).json({
            error: `Invalid status transition: ${quoteCheck.status} → ${req.body.status}. Allowed: ${allowed.join(", ") || "none"}`,
          });
          return;
        }

        updates.status = req.body.status;
      }
      if (req.body.currency !== undefined) updates.currency = req.body.currency;
      if (req.body.exchangeRateUsed !== undefined) updates.exchangeRateUsed = String(req.body.exchangeRateUsed);
      if (req.body.notesAndTerms !== undefined) updates.notesAndTerms = req.body.notesAndTerms;
      if (req.body.totalAmount !== undefined) updates.totalAmount = String(req.body.totalAmount);

      const [updated] = await db
        .update(quotesTable)
        .set(updates)
        .where(eq(quotesTable.id, req.params.quoteId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Quote not found" });
        return;
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

async function recalcQuoteTotal(quoteId: string) {
  const [totals] = await db
    .select({ total: sql<string>`COALESCE(SUM(${invoiceLineItemsTable.lineTotal}), 0)` })
    .from(invoiceLineItemsTable)
    .where(eq(invoiceLineItemsTable.quoteId, quoteId));

  await db
    .update(quotesTable)
    .set({ totalAmount: totals.total, updatedAt: new Date() })
    .where(eq(quotesTable.id, quoteId));
}

router.post(
  "/quotes/:quoteId/line-items",
  requireAuth,
  requireRole("CARE_COORDINATOR", "MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("ADD_LINE_ITEM", (req) => ({ type: "quote", id: req.params.quoteId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { serviceId, customDescription, quantity, unitPrice: manualUnitPrice } = req.body;

      if (!serviceId) {
        res.status(400).json({ error: "serviceId is required" });
        return;
      }

      const [quote] = await db
        .select()
        .from(quotesTable)
        .where(eq(quotesTable.id, req.params.quoteId))
        .limit(1);

      if (!quote) {
        res.status(404).json({ error: "Quote not found" });
        return;
      }

      const isAssigned = await checkStaffAssignment(req.user!.id, req.user!.role, quote.patientId);
      if (!isAssigned) {
        await logSecurityEvent("PERMISSION_DENIED", { userId: req.user!.id, reason: "staff_not_assigned_add_line_item", quoteId: req.params.quoteId }, req);
        res.status(403).json({ error: "You are not assigned to this patient" });
        return;
      }

      const [service] = await db
        .select()
        .from(serviceCatalogTable)
        .where(eq(serviceCatalogTable.id, serviceId))
        .limit(1);

      if (!service) {
        res.status(404).json({ error: "Service not found in catalog" });
        return;
      }

      const qty = quantity || 1;
      let price: number;

      if (manualUnitPrice !== undefined) {
        price = parseFloat(manualUnitPrice);
      } else {
        const basePriceEur = parseFloat(service.basePriceEur);
        const exchangeRate = parseFloat(quote.exchangeRateUsed);
        price = basePriceEur * exchangeRate;
      }

      const lineTotal = qty * price;

      const [item] = await db.insert(invoiceLineItemsTable).values({
        quoteId: req.params.quoteId,
        serviceId,
        customDescription: customDescription || service.defaultDescription,
        quantity: qty,
        unitPrice: String(price.toFixed(2)),
        lineTotal: String(lineTotal.toFixed(2)),
      }).returning();

      await recalcQuoteTotal(req.params.quoteId);

      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/quotes/:quoteId/line-items/:lineItemId",
  requireAuth,
  requireRole("CARE_COORDINATOR", "SUPER_ADMIN"),
  auditLog("UPDATE_LINE_ITEM", (req) => ({ type: "quote", id: req.params.quoteId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [quoteForAuth] = await db
        .select({ patientId: quotesTable.patientId })
        .from(quotesTable)
        .where(eq(quotesTable.id, req.params.quoteId))
        .limit(1);

      if (!quoteForAuth) {
        res.status(404).json({ error: "Quote not found" });
        return;
      }

      const isAssigned = await checkStaffAssignment(req.user!.id, req.user!.role, quoteForAuth.patientId);
      if (!isAssigned) {
        await logSecurityEvent("PERMISSION_DENIED", { userId: req.user!.id, reason: "staff_not_assigned_update_line_item", quoteId: req.params.quoteId }, req);
        res.status(403).json({ error: "You are not assigned to this patient" });
        return;
      }

      const [existing] = await db
        .select()
        .from(invoiceLineItemsTable)
        .where(
          and(
            eq(invoiceLineItemsTable.id, req.params.lineItemId),
            eq(invoiceLineItemsTable.quoteId, req.params.quoteId)
          )
        )
        .limit(1);

      if (!existing) {
        res.status(404).json({ error: "Line item not found" });
        return;
      }

      const updates: Partial<typeof invoiceLineItemsTable.$inferInsert> = {};

      if (req.body.customDescription !== undefined) updates.customDescription = req.body.customDescription;
      if (req.body.quantity !== undefined) updates.quantity = req.body.quantity;
      if (req.body.unitPrice !== undefined) updates.unitPrice = String(req.body.unitPrice);

      const qty = updates.quantity ?? existing.quantity;
      const price = parseFloat(updates.unitPrice ?? existing.unitPrice);
      updates.lineTotal = String((qty * price).toFixed(2));

      const [updated] = await db
        .update(invoiceLineItemsTable)
        .set(updates)
        .where(
          and(
            eq(invoiceLineItemsTable.id, req.params.lineItemId),
            eq(invoiceLineItemsTable.quoteId, req.params.quoteId)
          )
        )
        .returning();

      await recalcQuoteTotal(req.params.quoteId);

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/quotes/:quoteId/line-items/:lineItemId",
  requireAuth,
  requireRole("CARE_COORDINATOR", "SUPER_ADMIN"),
  auditLog("DELETE_LINE_ITEM", (req) => ({ type: "quote", id: req.params.quoteId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [quoteForAuth] = await db
        .select({ patientId: quotesTable.patientId })
        .from(quotesTable)
        .where(eq(quotesTable.id, req.params.quoteId))
        .limit(1);

      if (!quoteForAuth) {
        res.status(404).json({ error: "Quote not found" });
        return;
      }

      const isAssigned = await checkStaffAssignment(req.user!.id, req.user!.role, quoteForAuth.patientId);
      if (!isAssigned) {
        await logSecurityEvent("PERMISSION_DENIED", { userId: req.user!.id, reason: "staff_not_assigned_delete_line_item", quoteId: req.params.quoteId }, req);
        res.status(403).json({ error: "You are not assigned to this patient" });
        return;
      }

      const [deleted] = await db
        .delete(invoiceLineItemsTable)
        .where(
          and(
            eq(invoiceLineItemsTable.id, req.params.lineItemId),
            eq(invoiceLineItemsTable.quoteId, req.params.quoteId)
          )
        )
        .returning();

      if (!deleted) {
        res.status(404).json({ error: "Line item not found" });
        return;
      }

      await recalcQuoteTotal(req.params.quoteId);

      res.json({ message: "Line item deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
