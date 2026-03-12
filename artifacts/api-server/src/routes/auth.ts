import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usersTable, patientsTable, auditLogsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest, logSecurityEvent } from "../middlewares";

const router: IRouter = Router();

router.post("/auth/register", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: "email, password, firstName, lastName are required" });
      return;
    }

    const allowedRoles = ["PATIENT"];
    const assignedRole = allowedRoles.includes(role) ? role : "PATIENT";

    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db.insert(usersTable).values({
      email,
      passwordHash,
      role: assignedRole,
      firstName,
      lastName,
    }).returning();

    if (assignedRole === "PATIENT") {
      const celljevityId = `CELL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const [patient] = await db.insert(patientsTable).values({
        userId: user.id,
        celljevityId,
        journeyStage: "ACQUISITION",
        isLead: true,
      }).returning();

      await db.insert(auditLogsTable).values({
        userId: user.id,
        action: "PATIENT_CREATED",
        targetResourceType: "patient",
        targetResourceId: patient.id,
        details: JSON.stringify({ method: "POST", path: "/auth/register" }),
        ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
      });
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.lastActivity = Date.now();

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/auth/login", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (!user) {
      await logSecurityEvent("FAILED_LOGIN", { email, reason: "user_not_found" }, req);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    if (!user.isActive) {
      await logSecurityEvent("FAILED_LOGIN", { email, reason: "account_deactivated" }, req);
      res.status(401).json({ error: "Account deactivated" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await logSecurityEvent("FAILED_LOGIN", { email, reason: "invalid_password" }, req);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    await db.update(usersTable).set({ lastLogin: new Date() }).where(eq(usersTable.id, user.id));

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.lastActivity = Date.now();

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("celljevity.sid");
    res.json({ message: "Logged out" });
  });
});

router.get("/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(req.user);
});

export default router;
