import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { logSecurityEvent } from "./audit";

type Role = "PATIENT" | "CARE_COORDINATOR" | "MEDICAL_PROVIDER" | "SUPER_ADMIN";
type StaffRole = "CARE_COORDINATOR" | "MEDICAL_PROVIDER";

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

export function requireAssignedOrAdmin(patientIdParam: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const role = req.user.role as Role;
    if (role === "SUPER_ADMIN") {
      next();
      return;
    }

    if (role === "PATIENT") {
      next();
      return;
    }

    const staffRoles: StaffRole[] = ["CARE_COORDINATOR", "MEDICAL_PROVIDER"];
    if (staffRoles.includes(role as StaffRole)) {
      const targetPatientId = req.params[patientIdParam];
      if (targetPatientId) {
        const { db } = await import("@workspace/db");
        const { patientsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");

        const [patient] = await db
          .select({
            assignedCoordinatorId: patientsTable.assignedCoordinatorId,
            assignedProviderId: patientsTable.assignedProviderId,
          })
          .from(patientsTable)
          .where(eq(patientsTable.id, targetPatientId))
          .limit(1);

        if (patient) {
          const userId = req.user.id;
          if (
            (role === "CARE_COORDINATOR" && patient.assignedCoordinatorId === userId) ||
            (role === "MEDICAL_PROVIDER" && patient.assignedProviderId === userId)
          ) {
            next();
            return;
          }
        }
      }
    }

    await logSecurityEvent("PERMISSION_DENIED", {
      userId: req.user.id,
      userRole: req.user.role,
      reason: "not_assigned_to_patient",
      method: req.method,
      path: req.originalUrl,
    }, req);
    res.status(403).json({ error: "You are not assigned to this patient" });
  };
}
