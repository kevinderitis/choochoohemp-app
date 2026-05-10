import { useEffect, useState } from "react";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
};

export function PwaPrompt() {
  const [promptEvent, setPromptEvent] = useState<PromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as PromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (!promptEvent) return null;

  return (
    <button
      onClick={() => promptEvent.prompt()}
      className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200"
    >
      Install app
    </button>
  );
}
