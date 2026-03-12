import { Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { auditLogsTable, securityEventsTable } from "@workspace/db/schema";
import { AuthenticatedRequest } from "./auth";

export function auditLog(action: string, getResourceInfo?: (req: AuthenticatedRequest) => { type: string; id: string }) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      const resourceInfo = getResourceInfo?.(req);

      db.insert(auditLogsTable)
        .values({
          userId: req.user?.id ?? null,
          action,
          targetResourceType: resourceInfo?.type ?? null,
          targetResourceId: resourceInfo?.id ?? null,
          details: JSON.stringify({
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
          }),
          ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
        })
        .execute()
        .catch((err) => console.error("Audit log error:", err));

      return originalJson(body);
    };
    next();
  };
}

export async function logSecurityEvent(
  eventType: string,
  details: Record<string, unknown>,
  req: AuthenticatedRequest
) {
  try {
    await db.insert(securityEventsTable).values({
      userId: req.user?.id ?? req.session?.userId ?? null,
      eventType,
      ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
      userAgent: req.get("user-agent") ?? null,
      details: JSON.stringify(details),
    });
  } catch (err) {
    console.error("Security event log error:", err);
  }
}
