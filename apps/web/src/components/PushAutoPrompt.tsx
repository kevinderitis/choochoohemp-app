import { useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushAutoPrompt() {
  useEffect(() => {
    async function promptAfterInstall() {
      const token = localStorage.getItem("choochoo-token");
      const alreadyAsked = localStorage.getItem("choochoo-push-asked") === "true";
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

      if (!token || alreadyAsked || !isStandalone || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        return;
      }

      localStorage.setItem("choochoo-push-asked", "true");
      const config = await api.pushConfig();
      if (!config.enabled || !config.publicKey || Notification.permission !== "default") return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey)
      });

      await api.subscribePush(subscription.toJSON());
      toast.success("Push notifications enabled");
    }

    const timer = window.setTimeout(() => {
      promptAfterInstall().catch(() => {});
    }, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
