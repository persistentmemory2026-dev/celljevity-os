import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cookieParser from "cookie-parser";
import { pool } from "@workspace/db";
import router from "./routes";

const PgStore = connectPgSimple(session);

const app: Express = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const pgStorePool: ConstructorParameters<typeof PgStore>[0]["pool"] = pool;

app.use(
  session({
    store: new PgStore({
      pool: pgStorePool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    name: "celljevity.sid",
    secret: process.env.SESSION_SECRET || "celljevity-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 60 * 1000,
    },
  })
);

app.use("/api", router);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
