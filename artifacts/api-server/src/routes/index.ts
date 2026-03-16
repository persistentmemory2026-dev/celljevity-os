import { Router } from "express";
import authRoutes from "./auth";
import servicesRoutes from "./services";
import quotesRoutes from "./quotes";
import documentsRoutes from "./documents";

const router = Router();

// Auth routes (public)
router.use("/auth", authRoutes);

// Protected routes middleware
router.use((req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// Protected routes
router.use("/services", servicesRoutes);
router.use("/quotes", quotesRoutes);
router.use("/documents", documentsRoutes);

export default router;
