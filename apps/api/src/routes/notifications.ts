import express from "express";
import { z } from "zod";
import { requireAdmin, requireAuth, type AuthRequest } from "../middleware/auth.js";
import { PushSubscription } from "../models/PushSubscription.js";
import { getPushConfig, sendPushToRole } from "../services/push.js";
import { asyncHandler } from "../utils/http.js";

const router = express.Router();

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
});

router.get("/notifications/config", (_req: any, res: any) => {
  res.json(getPushConfig());
});

router.post(
  "/notifications/subscribe",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const body = z.object({ subscription: subscriptionSchema }).parse(req.body);
    await PushSubscription.findOneAndUpdate(
      { endpoint: body.subscription.endpoint },
      {
        $set: {
          userId: req.auth?.userId,
          role: req.auth?.role,
          endpoint: body.subscription.endpoint,
          keys: body.subscription.keys
        }
      },
      { upsert: true, new: true }
    );
    res.status(201).json({ message: "Subscription saved" });
  })
);

router.post(
  "/notifications/unsubscribe",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ endpoint: z.string().url() }).parse(req.body);
    await PushSubscription.deleteOne({ endpoint: body.endpoint });
    res.json({ message: "Subscription removed" });
  })
);

router.post(
  "/admin/notifications/send",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = z.object({ title: z.string().min(2), body: z.string().min(2), role: z.enum(["customer", "admin"]).default("customer") }).parse(req.body);
    const result = await sendPushToRole(body.role, { title: body.title, body: body.body, url: "/" });
    res.json({ message: "Notifications sent", result });
  })
);

export const notificationsRouter = router;
