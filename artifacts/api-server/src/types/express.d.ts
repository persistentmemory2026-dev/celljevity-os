import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: string;
    userRole: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      session: import("express-session").Session & {
        userId?: string;
        userRole?: string;
      };
    }
  }
}

export {};
