import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { quotesTable, invoiceLineItemsTable, serviceCatalogTable, quoteStatusEnum, patientsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireRole, auditLog, type AuthenticatedRequest } from "../middlewares";

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

      const limit = Math.min(parseInt(limitStr as string) || 50, 100);
      const offset = parseInt(offsetStr as string) || 0;

      const query = db.select().from(quotesTable);
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
          res.status(403).json({ error: "Access denied" });
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
      const updates: Partial<typeof quotesTable.$inferInsert> = { updatedAt: new Date() };

      if (req.body.status !== undefined && VALID_QUOTE_STATUSES.includes(req.body.status)) {
        const [existing] = await db
          .select({ status: quotesTable.status })
          .from(quotesTable)
          .where(eq(quotesTable.id, req.params.quoteId))
          .limit(1);

        if (!existing) {
          res.status(404).json({ error: "Quote not found" });
          return;
        }

        const allowedTransitions: Record<string, string[]> = {
          DRAFT: ["PENDING", "CANCELLED"],
          PENDING: ["ACCEPTED", "CANCELLED"],
          ACCEPTED: ["PAID", "CANCELLED"],
          PAID: [],
          CANCELLED: [],
        };

        const allowed = allowedTransitions[existing.status] || [];
        if (!allowed.includes(req.body.status)) {
          res.status(400).json({
            error: `Invalid status transition: ${existing.status} → ${req.body.status}. Allowed: ${allowed.join(", ") || "none"}`,
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

router.post(
  "/quotes/:quoteId/line-items",
  requireAuth,
  requireRole("CARE_COORDINATOR", "MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("ADD_LINE_ITEM", (req) => ({ type: "quote", id: req.params.quoteId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { serviceId, customDescription, quantity, unitPrice } = req.body;

      if (!serviceId || unitPrice === undefined) {
        res.status(400).json({ error: "serviceId and unitPrice are required" });
        return;
      }

      const qty = quantity || 1;
      const price = parseFloat(unitPrice);
      const lineTotal = qty * price;

      const [item] = await db.insert(invoiceLineItemsTable).values({
        quoteId: req.params.quoteId,
        serviceId,
        customDescription,
        quantity: qty,
        unitPrice: String(price),
        lineTotal: String(lineTotal),
      }).returning();

      const [totals] = await db
        .select({ total: sql<string>`COALESCE(SUM(${invoiceLineItemsTable.lineTotal}), 0)` })
        .from(invoiceLineItemsTable)
        .where(eq(invoiceLineItemsTable.quoteId, req.params.quoteId));

      await db
        .update(quotesTable)
        .set({ totalAmount: totals.total, updatedAt: new Date() })
        .where(eq(quotesTable.id, req.params.quoteId));

      res.status(201).json(item);
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

      const [totals] = await db
        .select({ total: sql<string>`COALESCE(SUM(${invoiceLineItemsTable.lineTotal}), 0)` })
        .from(invoiceLineItemsTable)
        .where(eq(invoiceLineItemsTable.quoteId, req.params.quoteId));

      await db
        .update(quotesTable)
        .set({ totalAmount: totals.total, updatedAt: new Date() })
        .where(eq(quotesTable.id, req.params.quoteId));

      res.json({ message: "Line item deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
