import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header />
        <main className="flex-1 px-8 py-8 space-y-7">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  highlight,
  description,
  actions,
  ambient = true,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
  actions?: ReactNode;
  ambient?: boolean;
}) {
  return (
    <div className="relative">
      {ambient && (
        <div className="pointer-events-none absolute -inset-x-8 -top-16 -bottom-8 -z-10 overflow-hidden">
          <div className="absolute left-[-4%] top-0 h-[420px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,106,31,0.16),rgba(255,106,31,0.04)_40%,transparent_70%)] blur-2xl ember-drift" />
          <div className="absolute right-[8%] -top-10 h-[360px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,138,74,0.10),transparent_65%)] blur-2xl" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,106,31,0.18)] to-transparent" />
        </div>
      )}
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[10.5px] font-semibold tracking-[0.22em] uppercase">
            <span className="bg-gradient-to-r from-[#8a8a93] to-[#5a5a63] bg-clip-text text-transparent">{eyebrow}</span>
          </div>
          <h1 className="mt-3 text-[36px] leading-[1.05] font-semibold tracking-[-0.02em] text-white">
            {title}
            {highlight && (
              <>
                {" "}
                <span className="bg-gradient-to-r from-[#ff8a4a] via-[#ff6a1f] to-[#ff5a0f] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(255,106,31,0.35)]">
                  {highlight}
                </span>
              </>
            )}
          </h1>
          <p className="mt-2.5 text-[14px] text-[#9a9aa3] leading-relaxed">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}

export function EmberButton({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute -inset-3 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(255,106,31,0.45),transparent_65%)] blur-xl" />
      <button className="relative h-10 px-4 rounded-lg bg-gradient-to-b from-[#ff7a35] to-[#ff5a0f] hover:from-[#ff8a4a] hover:to-[#ff6a1f] text-[13px] font-semibold text-white flex items-center gap-2 transition-all shadow-[0_10px_30px_-6px_rgba(255,106,31,0.55),0_0_0_1px_rgba(255,138,74,0.4)_inset,0_1px_0_0_rgba(255,255,255,0.25)_inset]">
        {Icon && <Icon className="h-4 w-4" strokeWidth={2.75} />}
        {children}
      </button>
    </div>
  );
}

export function GhostButton({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button className="h-10 px-4 rounded-lg border border-[#2a2a30] bg-[#0d0d10]/80 backdrop-blur hover:bg-[#16161a] hover:border-[#3a3a40] text-[13px] font-medium text-white flex items-center gap-2 transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={[
        "relative rounded-2xl border border-[#1f1f24] bg-gradient-to-b from-[#0e0e12] to-[#0a0a0d] overflow-hidden shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_30px_60px_-30px_rgba(0,0,0,0.9)]",
        className,
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      {children}
    </div>
  );
}
