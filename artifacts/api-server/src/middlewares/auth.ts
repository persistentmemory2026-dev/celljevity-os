import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
    lastActivity: number;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const now = Date.now();
  if (req.session.lastActivity && now - req.session.lastActivity > SESSION_TIMEOUT_MS) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Session expired due to inactivity" });
    return;
  }

  req.session.lastActivity = now;

  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        role: usersTable.role,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        isActive: usersTable.isActive,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId))
      .limit(1);

    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "User not found or deactivated" });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
