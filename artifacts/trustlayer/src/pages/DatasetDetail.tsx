import { Link, useParams, Redirect } from "wouter";
import {
  ChevronRight,
  Database,
  HardDrive,
  Clock,
  User,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Layers,
  Activity,
  Users,
  GitBranch,
  ExternalLink,
  Download,
} from "lucide-react";
import { PageHeader, EmberButton, GhostButton, Card } from "../components/Layout";
import { TrustRing } from "../components/TrustRing";
import { datasets, statusPill, trustExplanation } from "../lib/data";

function trustTier(trust: number) {
  if (trust >= 80) return { label: "Healthy · 80–100", tone: "bg-[rgba(52,211,153,0.10)] text-[#34d399] border-[rgba(52,211,153,0.28)]" };
  if (trust >= 60) return { label: "Warning · 60–79", tone: "bg-[rgba(251,191,36,0.10)] text-[#fbbf24] border-[rgba(251,191,36,0.28)]" };
  return { label: "At Risk · 0–59", tone: "bg-[rgba(248,113,113,0.10)] text-[#f87171] border-[rgba(248,113,113,0.28)]" };
}

function pillarBar(value: number) {
  const color = value >= 80 ? "from-[#34d399] to-[#10b981]" : value >= 60 ? "from-[#fbbf24] to-[#f59e0b]" : "from-[#f87171] to-[#ef4444]";
  const glow = value >= 80 ? "rgba(52,211,153,0.5)" : value >= 60 ? "rgba(251,191,36,0.5)" : "rgba(248,113,113,0.5)";
  return (
    <div className="relative h-1.5 w-full rounded-full bg-[#16161a] overflow-hidden">
      <div
        className={["absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", color].join(" ")}
        style={{ width: `${value}%`, boxShadow: `0 0 12px ${glow}` }}
      />
    </div>
  );
}

function PillarCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint: string;
}) {
  const valueColor = value >= 80 ? "text-[#34d399]" : value >= 60 ? "text-[#fbbf24]" : "text-[#f87171]";
  return (
    <div className="relative rounded-2xl border border-[#1f1f24] bg-gradient-to-b from-[#121215] to-[#0a0a0d] p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_48px_-24px_rgba(0,0,0,0.8)] overflow-hidden">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[rgba(255,106,31,0.08)] ring-1 ring-[rgba(255,106,31,0.18)] flex items-center justify-center">
            <Icon className="h-4 w-4 text-[#ff7a59]" />
          </div>
          <span className="text-[13.5px] font-semibold text-white">{label}</span>
        </div>
        <span className={["text-[22px] font-semibold tracking-tight tabular-nums", valueColor].join(" ")}>{value}</span>
      </div>
      <div className="mt-4">{pillarBar(value)}</div>
      <div className="mt-3 text-[11.5px] text-[#a1a1aa]">{hint}</div>
    </div>
  );
}

export default function DatasetDetail() {
  const params = useParams<{ name: string }>();
  const ds = datasets.find((d) => d.name === params.name);
  if (!ds) return <Redirect to="/datasets" />;

  const tier = trustTier(ds.trust);
  const stale = ds.pillars.freshness < 70;
  const schemaRisk = ds.pillars.schema < 70;

  return (
    <>
      <div className="text-[12px] text-[#a1a1aa] flex items-center gap-1.5">
        <Link href="/datasets" className="hover:text-white transition-colors">Datasets</Link>
        <ChevronRight className="h-3 w-3 text-[#3a3a40]" />
        <span className="text-[#d8d8de]">{ds.name}</span>
      </div>

      <PageHeader
        eyebrow="Dataset"
        title={ds.name}
        description={ds.description}
        actions={
          <>
            <GhostButton icon={Download}>Export schema</GhostButton>
            <EmberButton icon={ExternalLink}>Open in warehouse</EmberButton>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-5">
          <Card className="px-6 py-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={["inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium", statusPill(ds.status)].join(" ")}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {ds.status}
              </span>
              <span className="text-[#3a3a40]">·</span>
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#d8d8de]">
                <Database className="h-3.5 w-3.5 text-[#a1a1aa]" />
                {ds.source}
              </div>
              <span className="text-[#3a3a40]">·</span>
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#d8d8de]">
                <Layers className="h-3.5 w-3.5 text-[#a1a1aa]" />
                {ds.rows}
              </div>
              <span className="text-[#3a3a40]">·</span>
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#d8d8de]">
                <HardDrive className="h-3.5 w-3.5 text-[#a1a1aa]" />
                {ds.size}
              </div>
              <span className="text-[#3a3a40]">·</span>
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#d8d8de]">
                <Clock className="h-3.5 w-3.5 text-[#a1a1aa]" />
                Updated {ds.updated}
              </div>
              <span className="text-[#3a3a40]">·</span>
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#d8d8de]">
                <User className="h-3.5 w-3.5 text-[#a1a1aa]" />
                Owner · {ds.ownerName}
              </div>
            </div>
          </Card>

          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-white">Score breakdown</h2>
            <p className="mt-1 text-[12.5px] text-[#a1a1aa]">Four pillars contribute to the overall trust score.</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PillarCard icon={Clock} label="Freshness" value={ds.pillars.freshness} hint="Time since last successful refresh" />
              <PillarCard icon={Users} label="Ownership" value={ds.pillars.ownership} hint="Assigned data steward & on-call" />
              <PillarCard icon={ShieldCheck} label="Schema" value={ds.pillars.schema} hint="Schema stability over the last 30 days" />
              <PillarCard icon={Activity} label="Volume" value={ds.pillars.volume} hint="Row volume vs. expected baseline" />
            </div>
          </div>

          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-white">Recent checks</h2>
            <p className="mt-1 text-[12.5px] text-[#a1a1aa]">Latest validations across the pipeline.</p>
            <Card className="mt-4 divide-y divide-[#101014]">
              {[
                { label: "Schema integrity", ok: !schemaRisk, sub: schemaRisk ? "1 column dropped upstream" : "All columns match contract" },
                { label: "Freshness SLA", ok: !stale, sub: stale ? `Lag exceeded SLA (last refresh ${ds.updated})` : "Within SLA window" },
                { label: "Row volume anomaly", ok: ds.pillars.volume >= 60, sub: ds.pillars.volume >= 60 ? "Within ±5% of baseline" : "Below expected baseline" },
                { label: "Null rate", ok: true, sub: "All required columns under threshold" },
              ].map((c) => (
                <div key={c.label} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="text-[13px] font-medium text-white">{c.label}</div>
                    <div className="mt-0.5 text-[11.5px] text-[#a1a1aa]">{c.sub}</div>
                  </div>
                  {c.ok ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[rgba(52,211,153,0.10)] text-[#34d399] border border-[rgba(52,211,153,0.25)]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[rgba(251,191,36,0.10)] text-[#fbbf24] border border-[rgba(251,191,36,0.25)]">
                      <AlertTriangle className="h-3.5 w-3.5" /> Warn
                    </span>
                  )}
                </div>
              ))}
            </Card>
          </div>
        </div>

        <div className="space-y-5 lg:sticky lg:top-24">
          <Card className="px-6 py-6">
            <div className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-[#5a5a63]">Trust Score</div>
            <div className="mt-4 flex items-center gap-5">
              <div className="relative">
                <span className="pointer-events-none absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(255,106,31,0.30),transparent_65%)] blur-xl" />
                <TrustRing score={ds.trust} size={120} />
              </div>
              <div>
                <span className={["inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border", tier.tone].join(" ")}>
                  {tier.label}
                </span>
                <div className="mt-2 text-[12px] text-[#a1a1aa]">out of 100</div>
                <div className="mt-1 text-[11.5px] text-[#5a5a63]">Recalculated 2 min ago</div>
              </div>
            </div>
          </Card>

          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-white">Why this score?</h2>
            <p className="mt-1 text-[12.5px] text-[#a1a1aa]">Auto-generated from signals across your stack.</p>

            <Card className="mt-4 p-5">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold text-white">
                <Sparkles className="h-4 w-4 text-[#ff7a59]" />
                TrustLayer AI explanation
              </div>
              <div className="mt-4 space-y-2.5">
                <div className="rounded-lg border border-[#1f1f24] bg-[#0a0a0d] px-3.5 py-3 text-[12.5px] text-[#d8d8de] leading-relaxed">
                  Refreshed {ds.updated}, {stale ? "outside" : "well within"} the 1-hour SLA.
                </div>
                <div className="rounded-lg border border-[#1f1f24] bg-[#0a0a0d] px-3.5 py-3 text-[12.5px] text-[#d8d8de] leading-relaxed">
                  Owner <span className="text-white font-medium">{ds.ownerName}</span> has acknowledged all alerts in the last 7 days.
                </div>
                <div className="rounded-lg border border-[#1f1f24] bg-[#0a0a0d] px-3.5 py-3 text-[12.5px] text-[#d8d8de] leading-relaxed">
                  Schema stability {ds.pillars.schema}/100 — {schemaRisk ? "recent upstream changes detected." : "no breaking changes detected."}
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-2">
            <GhostButton icon={GitBranch}>View lineage</GhostButton>
            <GhostButton icon={Users}>Contact owner</GhostButton>
          </div>
        </div>
      </div>
    </>
  );
}
