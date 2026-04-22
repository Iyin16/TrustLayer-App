import { ArrowUpRight } from "lucide-react";

export type Kpi = {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "ember" | "success" | "danger" | "warning";
};

export function toneClasses(tone: Kpi["tone"]) {
  switch (tone) {
    case "ember": return { bg: "bg-[rgba(255,106,31,0.08)]", text: "text-[#ff4d2e]" };
    case "success": return { bg: "bg-[rgba(52,211,153,0.08)]", text: "text-[#34d399]" };
    case "danger": return { bg: "bg-[rgba(248,113,113,0.08)]", text: "text-[#f87171]" };
    case "warning": return { bg: "bg-[rgba(251,191,36,0.08)]", text: "text-[#fbbf24]" };
  }
}

export function KpiCards({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((kpi) => {
        const t = toneClasses(kpi.tone);
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className="group relative rounded-2xl border border-[#1f1f24] bg-gradient-to-b from-[#121215] via-[#0e0e12] to-[#0a0a0d] p-5 hover:border-[#2a2a30] transition-all shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_48px_-24px_rgba(0,0,0,0.8),0_2px_8px_-2px_rgba(0,0,0,0.4)] overflow-hidden"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <span className={["pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-60 blur-2xl", t.bg].join(" ")} />
            <div className="relative flex items-start justify-between">
              <div className="text-[13px] font-medium text-[#b0b0bb] tracking-tight">{kpi.label}</div>
              <div className={["h-8 w-8 rounded-lg flex items-center justify-center ring-1 ring-white/[0.04]", t.bg].join(" ")}>
                <Icon className={["h-4 w-4", t.text].join(" ")} />
              </div>
            </div>
            <div className="relative mt-5 text-[36px] font-semibold tracking-[-0.02em] leading-none text-white">
              {kpi.value}
            </div>
            <div className="relative mt-4 flex items-center gap-1.5 text-[11.5px] text-[#a1a1aa]">
              <ArrowUpRight className="h-3 w-3 text-[#6a6a73]" />
              {kpi.delta}
            </div>
          </div>
        );
      })}
    </div>
  );
}
