import { Router } from "express";
import { db, services } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

// GET /api/services
router.get("/", async (req, res) => {
  try {
    const allServices = await db.query.services.findMany({
      where: eq(services.active, true),
      orderBy: services.name,
    });

    res.json({ services: allServices });
  } catch (error) {
    console.error("Get services error:", error);
    res.status(500).json({ error: "Failed to get services" });
  }
});

// GET /api/services/:id
router.get("/:id", async (req, res) => {
  try {
    const service = await db.query.services.findFirst({
      where: and(
        eq(services.id, req.params.id),
        eq(services.active, true)
      ),
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json({ service });
  } catch (error) {
    console.error("Get service error:", error);
    res.status(500).json({ error: "Failed to get service" });
  }
});

export default router;
