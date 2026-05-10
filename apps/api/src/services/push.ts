import webpush from "web-push";
import { env } from "../config/env.js";
import { PushSubscription } from "../models/PushSubscription.js";

const pushConfigured = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);

if (pushConfigured) {
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

export function getPushConfig() {
  return {
    enabled: pushConfigured,
    publicKey: env.VAPID_PUBLIC_KEY
  };
}

export async function sendPushToRole(role: "customer" | "admin", payload: Record<string, unknown>, userId?: string) {
  if (!pushConfigured) return { sent: 0, failed: 0 };
  const query = userId ? { role, userId } : { role };
  const subscriptions = await PushSubscription.find(query).lean();
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          },
          JSON.stringify(payload)
        );
        sent += 1;
      } catch {
        failed += 1;
      }
    })
  );

  return { sent, failed };
}
