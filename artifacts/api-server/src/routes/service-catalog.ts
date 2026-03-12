import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { serviceCatalogTable, serviceCategoryEnum } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole, auditLog, type AuthenticatedRequest } from "../middlewares";

const router: IRouter = Router();
const VALID_CATEGORIES = serviceCategoryEnum.enumValues;

router.get(
  "/services",
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { category, activeOnly } = req.query;
      const conditions: ReturnType<typeof eq>[] = [];

      if (category && typeof category === "string" && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
        conditions.push(eq(serviceCatalogTable.category, category as typeof VALID_CATEGORIES[number]));
      }

      if (activeOnly !== "false") {
        conditions.push(eq(serviceCatalogTable.isActive, true));
      }

      const result = conditions.length > 0
        ? await db.select().from(serviceCatalogTable).where(and(...conditions))
        : await db.select().from(serviceCatalogTable);

      const role = req.user!.role;
      const filtered = result.map((svc) => {
        if (role === "PATIENT") {
          return {
            id: svc.id,
            category: svc.category,
            name: svc.name,
            defaultDescription: svc.defaultDescription,
            basePriceEur: svc.basePriceEur,
            isActive: svc.isActive,
          };
        }
        return svc;
      });

      res.json({ data: filtered });
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

      if (req.user!.role === "PATIENT") {
        res.json({
          id: service.id,
          category: service.category,
          name: service.name,
          defaultDescription: service.defaultDescription,
          basePriceEur: service.basePriceEur,
          isActive: service.isActive,
        });
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

      if (!VALID_CATEGORIES.includes(category)) {
        res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` });
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
      const updates: Partial<typeof serviceCatalogTable.$inferInsert> = { updatedAt: new Date() };

      if (req.body.category !== undefined && VALID_CATEGORIES.includes(req.body.category)) {
        updates.category = req.body.category;
      }
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.defaultDescription !== undefined) updates.defaultDescription = req.body.defaultDescription;
      if (req.body.basePriceEur !== undefined) updates.basePriceEur = String(req.body.basePriceEur);
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
      if (req.body.isPartnerService !== undefined) updates.isPartnerService = req.body.isPartnerService;
      if (req.body.partnerName !== undefined) updates.partnerName = req.body.partnerName;

      const [updated] = await db
        .update(serviceCatalogTable)
        .set(updates)
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
