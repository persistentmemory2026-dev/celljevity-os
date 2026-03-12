import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { quotesTable, invoiceLineItemsTable, serviceCatalogTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireRole, requireSelfOrRole, auditLog, type AuthenticatedRequest } from "../middlewares";

const router: IRouter = Router();

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
  requireRole("CARE_COORDINATOR", "MEDICAL_PROVIDER", "SUPER_ADMIN"),
  auditLog("LIST_QUOTES"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { patientId, status, limit: limitStr, offset: offsetStr } = req.query;
      const conditions = [];

      if (patientId && typeof patientId === "string") {
        conditions.push(eq(quotesTable.patientId, patientId));
      }
      if (status && typeof status === "string") {
        conditions.push(eq(quotesTable.status, status as any));
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
      const allowedFields = ["status", "currency", "exchangeRateUsed", "notesAndTerms", "totalAmount"];
      const updates: Record<string, unknown> = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          if (field === "exchangeRateUsed" || field === "totalAmount") {
            updates[field] = String(req.body[field]);
          } else {
            updates[field] = req.body[field];
          }
        }
      }

      updates.updatedAt = new Date();

      const [updated] = await db
        .update(quotesTable)
        .set(updates as any)
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
