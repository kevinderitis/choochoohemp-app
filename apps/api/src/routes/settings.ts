import express from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import { getSettings } from "../services/settings.js";
import { asyncHandler } from "../utils/http.js";

const router = express.Router();

const settingsSchema = z.object({
  deliveryFee: z.coerce.number().min(0),
  openingHours: z.string(),
  paymentMethods: z.array(z.enum(["cash", "card"])),
  legalMessage: z.string(),
  contactLine: z.string(),
  contactWhatsapp: z.string(),
  contactEmail: z.string().email(),
  deliveryPolicy: z.string(),
  termsText: z.string(),
  privacyText: z.string()
});

router.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const settings = await getSettings();
    res.json({ settings });
  })
);

router.put(
  "/admin/settings",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = settingsSchema.parse(req.body);
    const settings = await getSettings();
    Object.assign(settings, body);
    await settings.save();
    res.json({ settings });
  })
);

export const settingsRouter = router;
