import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { serviceCatalogTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireRole, auditLog, type AuthenticatedRequest } from "../middlewares";

const router: IRouter = Router();

router.get(
  "/services",
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { category, activeOnly } = req.query;
      const conditions = [];

      if (category && typeof category === "string") {
        conditions.push(eq(serviceCatalogTable.category, category as any));
      }

      if (activeOnly !== "false") {
        conditions.push(eq(serviceCatalogTable.isActive, true));
      }

      const result = conditions.length > 0
        ? await db.select().from(serviceCatalogTable).where(and(...conditions))
        : await db.select().from(serviceCatalogTable);

      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/services/:serviceId",
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [service] = await db
        .select()
        .from(serviceCatalogTable)
        .where(eq(serviceCatalogTable.id, req.params.serviceId))
        .limit(1);

      if (!service) {
        res.status(404).json({ error: "Service not found" });
        return;
      }
      res.json(service);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/services",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  auditLog("CREATE_SERVICE"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { category, name, defaultDescription, basePriceEur, isPartnerService, partnerName } = req.body;

      if (!category || !name || basePriceEur === undefined) {
        res.status(400).json({ error: "category, name, basePriceEur are required" });
        return;
      }

      const [service] = await db.insert(serviceCatalogTable).values({
        category,
        name,
        defaultDescription,
        basePriceEur: String(basePriceEur),
        isPartnerService: isPartnerService || false,
        partnerName,
      }).returning();

      res.status(201).json(service);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/services/:serviceId",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  auditLog("UPDATE_SERVICE", (req) => ({ type: "service", id: req.params.serviceId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const allowedFields = ["category", "name", "defaultDescription", "basePriceEur", "isActive", "isPartnerService", "partnerName"];
      const updates: Record<string, unknown> = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          if (field === "basePriceEur") {
            updates[field] = String(req.body[field]);
          } else {
            updates[field] = req.body[field];
          }
        }
      }

      updates.updatedAt = new Date();

      const [updated] = await db
        .update(serviceCatalogTable)
        .set(updates as any)
        .where(eq(serviceCatalogTable.id, req.params.serviceId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Service not found" });
        return;
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
