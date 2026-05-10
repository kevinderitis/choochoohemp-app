type AnyFn = (...args: any[]) => void;
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

export interface AuthRequest {
  headers: Record<string, string | undefined>;
  body: any;
  auth?: {
    userId: string;
    role: "customer" | "admin";
  };
}

export function requireAuth(req: AuthRequest, _res: unknown, next: AnyFn) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Authentication required"));
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as { sub: string; role: "customer" | "admin" };
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, "Invalid session"));
  }
}

export function requireAdmin(req: AuthRequest, _res: unknown, next: AnyFn) {
  requireAuth(req, _res, (error) => {
    if (error) return next(error);
    if (req.auth?.role !== "admin") return next(new HttpError(403, "Admin access required"));
    next();
  });
}
