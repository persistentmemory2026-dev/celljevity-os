import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { logSecurityEvent } from "./audit";

type Role = "PATIENT" | "CARE_COORDINATOR" | "MEDICAL_PROVIDER" | "SUPER_ADMIN";

export function requireRole(...roles: Role[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      await logSecurityEvent("PERMISSION_DENIED", {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        method: req.method,
        path: req.originalUrl,
      }, req);
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

export function requireSelfOrRole(patientIdParam: string, ...roles: Role[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (roles.includes(req.user.role as Role)) {
      next();
      return;
    }

    if (req.user.role === "PATIENT") {
      const targetPatientId = req.params[patientIdParam];
      if (targetPatientId && req.user.id) {
        const { db } = await import("@workspace/db");
        const { patientsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");

        const [patient] = await db
          .select({ userId: patientsTable.userId })
          .from(patientsTable)
          .where(eq(patientsTable.id, targetPatientId))
          .limit(1);

        if (patient && patient.userId === req.user.id) {
          next();
          return;
        }
      }
    }

    await logSecurityEvent("PERMISSION_DENIED", {
      userId: req.user.id,
      userRole: req.user.role,
      requiredRoles: roles,
      method: req.method,
      path: req.originalUrl,
      patientIdParam,
    }, req);
    res.status(403).json({ error: "Insufficient permissions" });
  };
}
