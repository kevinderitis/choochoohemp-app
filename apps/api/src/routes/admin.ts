import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/http.js";

const router = express.Router();

router.get(
  "/customers",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const customers = await User.find({ role: "customer" }).sort({ createdAt: -1 }).lean();
    res.json({ customers });
  })
);

export const adminRouter = router;
