import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { notificationsRouter } from "./routes/notifications.js";
import { ordersRouter } from "./routes/orders.js";
import { productsRouter } from "./routes/products.js";
import { settingsRouter } from "./routes/settings.js";
import { errorMiddleware } from "./utils/http.js";

export const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((item) => item.trim()),
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120
  })
);
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.use("/api/auth", authRouter);
app.use("/api", productsRouter);
app.use("/api", ordersRouter);
app.use("/api", notificationsRouter);
app.use("/api", settingsRouter);
app.use("/api/admin", adminRouter);

app.get("/api/health", (_req: any, res: any) => {
  res.json({ ok: true });
});

app.use(errorMiddleware);
