import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Shell({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen bg-black text-mist">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[26rem] bg-gradient-to-b from-black via-black to-[#08110d]" />
      <div aria-hidden="true" className="app-smoke-layer">
        <span className="app-smoke app-smoke-a" />
        <span className="app-smoke app-smoke-b" />
        <span className="app-smoke app-smoke-c" />
        <span className="app-smoke app-smoke-d" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function GlassCard({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("rounded-3xl border border-transparent bg-white/5 backdrop-blur-xl shadow-glow", className)}>{children}</div>;
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
