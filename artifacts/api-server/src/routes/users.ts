import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usersTable, patientsTable, auditLogsTable, userRoleEnum } from "@workspace/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { requireAuth, requireRole, auditLog, type AuthenticatedRequest } from "../middlewares";

const router: IRouter = Router();
const VALID_ROLES = userRoleEnum.enumValues;

router.get(
  "/users",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  auditLog("LIST_USERS"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { role, limit: limitStr, offset: offsetStr } = req.query;
      const limit = Math.min(parseInt(limitStr as string) || 50, 100);
      const offset = parseInt(offsetStr as string) || 0;

      const query = db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          role: usersTable.role,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          isActive: usersTable.isActive,
          createdAt: usersTable.createdAt,
          lastLogin: usersTable.lastLogin,
        })
        .from(usersTable);

      const result = role && typeof role === "string" && VALID_ROLES.includes(role as typeof VALID_ROLES[number])
        ? await query.where(eq(usersTable.role, role as typeof VALID_ROLES[number])).limit(limit).offset(offset)
        : await query.limit(limit).offset(offset);

      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);

      res.json({ data: result, total: Number(count), limit, offset });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/users",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  auditLog("CREATE_USER"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password || !firstName || !lastName || !role) {
        res.status(400).json({ error: "email, password, firstName, lastName, role are required" });
        return;
      }

      if (!VALID_ROLES.includes(role)) {
        res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
        return;
      }

      const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (existing.length > 0) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [user] = await db.insert(usersTable).values({
        email,
        passwordHash,
        role,
        firstName,
        lastName,
      }).returning();

      if (role === "PATIENT") {
        const celljevityId = `CELL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await db.insert(patientsTable).values({
          userId: user.id,
          celljevityId,
          journeyStage: "ACQUISITION",
          isLead: true,
        });
      }

      res.status(201).json({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/users/:userId",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  auditLog("UPDATE_USER", (req) => ({ type: "user", id: req.params.userId })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const updates: Partial<typeof usersTable.$inferInsert> = { updatedAt: new Date() };

      if (req.body.firstName !== undefined) updates.firstName = req.body.firstName;
      if (req.body.lastName !== undefined) updates.lastName = req.body.lastName;
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
      if (req.body.role !== undefined && VALID_ROLES.includes(req.body.role)) {
        updates.role = req.body.role;
      }
      if (req.body.password) {
        updates.passwordHash = await bcrypt.hash(req.body.password, 12);
      }

      const [updated] = await db
        .update(usersTable)
        .set(updates)
        .where(eq(usersTable.id, req.params.userId))
        .returning({
          id: usersTable.id,
          email: usersTable.email,
          role: usersTable.role,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          isActive: usersTable.isActive,
        });

      if (!updated) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/users/audit-logs",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = parseInt(req.query.offset as string) || 0;

      const logs = await db
        .select()
        .from(auditLogsTable)
        .orderBy(desc(auditLogsTable.timestamp))
        .limit(limit)
        .offset(offset);

      res.json({ data: logs, limit, offset });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
