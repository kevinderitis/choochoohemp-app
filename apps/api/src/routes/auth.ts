import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { asyncHandler, HttpError } from "../utils/http.js";

const router = express.Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional()
});

function createToken(userId: string, role: "customer" | "admin") {
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = authSchema.extend({ name: z.string().min(2) }).parse(req.body);
    const exists = await User.findOne({ email: body.email.toLowerCase() });
    if (exists) throw new HttpError(409, "Email already registered");

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash,
      phone: body.phone || "",
      address: body.address || "",
      role: "customer"
    });

    res.status(201).json({
      token: createToken(user.id, "customer"),
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role }
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = authSchema.pick({ email: true, password: true }).parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user) throw new HttpError(401, "Invalid credentials");
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) throw new HttpError(401, "Invalid credentials");

    res.json({
      token: createToken(user.id, user.role),
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role }
    });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await User.findById(req.auth?.userId).lean();
    if (!user) throw new HttpError(404, "User not found");
    res.json({
      user: { id: String(user._id), name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role }
    });
  })
);

export const authRouter = router;
