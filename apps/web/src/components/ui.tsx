import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Shell({ children }: PropsWithChildren) {
  return <div className="min-h-screen bg-night text-mist">{children}</div>;
}

export function GlassCard({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-glow", className)}>{children}</div>;
}

export function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/80">{eyebrow}</p>
      <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{title}</h2>
      {body ? <p className="max-w-2xl text-sm text-mist/70 sm:text-base">{body}</p> : null}
    </div>
  );
}
