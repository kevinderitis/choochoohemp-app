import { useAppStore } from "@/lib/store";
import { GlassCard } from "./ui";

export function AgeGate() {
  const accepted = useAppStore((state) => state.ageAccepted);
  const setAccepted = useAppStore((state) => state.setAgeAccepted);

  if (accepted) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 px-4">
      <GlassCard className="max-w-lg space-y-6 p-8 text-center">
        <img src="/logo.png" alt="Choo Choo Hemp" className="mx-auto h-36 w-auto object-contain" />
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">Member Access</p>
          <h1 className="font-display text-3xl font-bold text-white">Confirm that you are 18 or older</h1>
          <p className="text-sm text-mist/75">
            Available only for adults of legal age and where local regulations allow it. We do not promote irresponsible consumption.
          </p>
        </div>
        <button
          className="w-full rounded-2xl bg-emerald-300 px-4 py-3 font-semibold text-night transition hover:bg-emerald-200"
          onClick={() => setAccepted(true)}
        >
          I am 18+ and accept the legal disclaimer
        </button>
      </GlassCard>
    </div>
  );
}
