import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Plus,
  Upload,
  Database,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  X,
  ExternalLink,
  GitBranch,
  Users,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  ArrowUpDown,
  Network,
  FlaskConical,
  Sparkles,
} from "lucide-react";
import { PageHeader, EmberButton, GhostButton, Card } from "../components/Layout";
import { KpiCards, type Kpi } from "../components/KpiCards";
import { TrustRing } from "../components/TrustRing";
import { datasets, statusPill, trustCounts, trustExplanation, type Dataset } from "../lib/data";

const kpis: Kpi[] = [
  { label: "Connected Sources", value: "4", delta: "Snowflake · BigQuery · Postgres · Databricks", icon: Database, tone: "ember" },
  { label: "Healthy", value: String(trustCounts.healthy), delta: "Score 80 – 100", icon: ShieldCheck, tone: "success" },
  { label: "Warning", value: String(trustCounts.warning), delta: "Score 60 – 79", icon: AlertTriangle, tone: "warning" },
  { label: "At Risk", value: String(trustCounts.atRisk), delta: "Score 0 – 59", icon: Clock, tone: "danger" },
];

const sources = ["All", "Snowflake", "BigQuery", "Postgres", "Redshift", "Databricks"] as const;
const statuses = ["All", "Healthy", "Warning", "At Risk"] as const;
const sortOptions = ["Highest Trust Score", "Lowest Trust Score", "Recently Updated"] as const;
type SortOption = typeof sortOptions[number];

function trustBadge(score: number) {
  const tone =
    score >= 80
      ? "bg-[rgba(52,211,153,0.10)] text-[#34d399] border-[rgba(52,211,153,0.28)]"
      : score >= 60
      ? "bg-[rgba(251,191,36,0.10)] text-[#fbbf24] border-[rgba(251,191,36,0.28)]"
      : "bg-[rgba(248,113,113,0.10)] text-[#f87171] border-[rgba(248,113,113,0.28)]";
  return (
    <span className={["inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border", tone].join(" ")}>
      <span className="h-1 w-1 rounded-full bg-current" />
      {score}
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "h-8 px-3 rounded-full text-[12px] font-medium transition-all whitespace-nowrap",
        active
          ? "bg-gradient-to-b from-[#241712] to-[#1a1410] text-white border border-[#3a2418] shadow-[inset_0_1px_0_0_rgba(255,138,74,0.12),0_4px_14px_-6px_rgba(255,106,31,0.5)]"
          : "bg-[#0d0d10] text-[#9a9aa3] border border-[#1f1f24] hover:text-white hover:border-[#2a2a30]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function MetricRow({
  icon: Icon,
  label,
  value,
  state,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  state: "ok" | "warn" | "bad";
  hint: string;
}) {
  const tone =
    state === "ok"
      ? "text-[#34d399] bg-[rgba(52,211,153,0.10)] ring-[rgba(52,211,153,0.25)]"
      : state === "warn"
      ? "text-[#fbbf24] bg-[rgba(251,191,36,0.10)] ring-[rgba(251,191,36,0.25)]"
      : "text-[#f87171] bg-[rgba(248,113,113,0.10)] ring-[rgba(248,113,113,0.25)]";
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-[#1f1f24] bg-[#0a0a0d] px-3.5 py-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <div className={["h-7 w-7 rounded-md ring-1 flex items-center justify-center shrink-0", tone].join(" ")}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[12.5px] font-medium text-white">{label}</div>
          <div className="mt-0.5 text-[11.5px] text-[#a1a1aa] leading-snug">{hint}</div>
        </div>
      </div>
      <div className={["text-[12px] font-semibold tabular-nums whitespace-nowrap", state === "ok" ? "text-[#34d399]" : state === "warn" ? "text-[#fbbf24]" : "text-[#f87171]"].join(" ")}>{value}</div>
    </div>
  );
}

function DetailPanel({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const freshState: "ok" | "warn" | "bad" = ds.pillars.freshness >= 80 ? "ok" : ds.pillars.freshness >= 60 ? "warn" : "bad";
  const lineageState: "ok" | "warn" | "bad" = ds.lineage.coverage >= 80 ? "ok" : ds.lineage.coverage >= 60 ? "warn" : "bad";
  const qPct = Math.round((ds.qualityTests.passed / ds.qualityTests.total) * 100);
  const qualityState: "ok" | "warn" | "bad" = qPct >= 90 ? "ok" : qPct >= 60 ? "warn" : "bad";
  return (
    <Card className="p-0 overflow-hidden">
      <div className="relative px-6 pt-6 pb-5 border-b border-[#16161a]">
        <span className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,106,31,0.18),transparent_65%)] blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-[#5a5a63]">Dataset</div>
            <h3 className="mt-2 text-[20px] font-semibold tracking-tight text-white">{ds.name}</h3>
            <div className="mt-1 text-[12.5px] text-[#a1a1aa]">{ds.source}</div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-[#a1a1aa] hover:text-white hover:bg-[#101014] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative mt-5 flex items-center gap-4">
          <TrustRing score={ds.trust} size={64} />
          <div>
            <div className="text-[12px] font-medium text-[#a8a8b3]">Trust Score</div>
            <div className="mt-0.5 text-[11.5px] text-[#a1a1aa] max-w-[210px] leading-relaxed">
              {trustExplanation(ds.trust)}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#1f1f24] bg-[#0d0d10] p-3">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#5a5a63] font-semibold">Owner</div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-[#1f1f24] flex items-center justify-center text-[9.5px] font-semibold text-[#a8a8b3]">{ds.ownerInitials}</div>
              <span className="text-[12.5px] text-white truncate">{ds.ownerName}</span>
            </div>
          </div>
          <div className="rounded-lg border border-[#1f1f24] bg-[#0d0d10] p-3">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#5a5a63] font-semibold">Last Updated</div>
            <div className="mt-1.5 text-[12.5px] text-white">{ds.updated}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#5a5a63] font-semibold">Health signals</div>
          <MetricRow
            icon={Clock}
            label="Freshness"
            value={`${ds.pillars.freshness}/100`}
            state={freshState}
            hint={freshState === "ok" ? "Within SLA window" : freshState === "warn" ? `Lag detected (last refresh ${ds.updated})` : `Stale — last refresh ${ds.updated}`}
          />
          <MetricRow
            icon={Network}
            label="Lineage completeness"
            value={`${ds.lineage.coverage}%`}
            state={lineageState}
            hint={`${ds.lineage.upstream} upstream · ${ds.lineage.downstream} downstream tracked`}
          />
          <MetricRow
            icon={FlaskConical}
            label="Quality tests"
            value={`${ds.qualityTests.passed}/${ds.qualityTests.total}`}
            state={qualityState}
            hint={qualityState === "ok" ? "All checks passing" : qualityState === "warn" ? `${ds.qualityTests.total - ds.qualityTests.passed} checks failing` : `${ds.qualityTests.total - ds.qualityTests.passed} checks failing — review required`}
          />
        </div>

        <div className="rounded-lg border border-[#1f1f24] bg-[#0a0a0d] p-3.5">
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5 text-[#ff7a59]" /> Why this score?
          </div>
          <div className="mt-1.5 text-[11.5px] text-[#a1a1aa] leading-relaxed">
            {trustExplanation(ds.trust)}
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Link href={`/datasets/${ds.name}`} className="block">
            <EmberButton icon={ExternalLink}>Open dataset</EmberButton>
          </Link>
          <GhostButton icon={GitBranch}>View lineage</GhostButton>
          <GhostButton icon={Users}>Contact owner</GhostButton>
        </div>
      </div>
    </Card>
  );
}

export default function Datasets() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<typeof sources[number]>("All");
  const [status, setStatus] = useState<typeof statuses[number]>("All");
  const [sort, setSort] = useState<SortOption>("Highest Trust Score");
  const [selected, setSelected] = useState<Dataset | null>(datasets[0]);

  const filtered = useMemo(() => {
    const list = datasets.filter((d) => {
      if (source !== "All" && d.source !== source) return false;
      if (status !== "All" && d.status !== status) return false;
      if (query && !`${d.name} ${d.ownerName} ${d.source}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "Highest Trust Score") sorted.sort((a, b) => b.trust - a.trust);
    else if (sort === "Lowest Trust Score") sorted.sort((a, b) => a.trust - b.trust);
    else sorted.sort((a, b) => a.updatedMinutes - b.updatedMinutes);
    return sorted;
  }, [query, source, status, sort]);

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Datasets"
        description="Browse, search, and manage every dataset registered to TrustLayer."
        actions={
          <>
            <GhostButton icon={Upload}>Import schema</GhostButton>
            <EmberButton icon={Plus}>New dataset</EmberButton>
          </>
        }
      />
      <KpiCards items={kpis} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 items-start">
        <Card>
          <div className="px-6 pt-6 pb-5 space-y-5">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight">All datasets</h2>
                <p className="mt-1 text-[12.5px] text-[#a1a1aa]">
                  Showing {filtered.length} of {datasets.length} · {sort.toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a63]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or owner..."
                    className="h-9 w-72 pl-8 pr-3 rounded-lg bg-[#0d0d10] border border-[#1f1f24] text-[12.5px] placeholder:text-[#5a5a63] text-white focus:outline-none focus:border-[#2a2a30] transition-colors"
                  />
                </div>
                <div className="relative">
                  <ArrowUpDown className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a63] pointer-events-none" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="appearance-none h-9 pl-8 pr-8 rounded-lg bg-[#0d0d10] border border-[#1f1f24] text-[12.5px] text-white focus:outline-none focus:border-[#2a2a30] transition-colors cursor-pointer hover:border-[#2a2a30]"
                  >
                    {sortOptions.map((o) => (
                      <option key={o} value={o} className="bg-[#0d0d10]">{o}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a63] text-[10px]">▾</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63]">
                <Filter className="h-3 w-3" /> Source
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sources.map((s) => (
                  <FilterChip key={s} active={source === s} onClick={() => setSource(s)}>{s}</FilterChip>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63]">
                <Activity className="h-3 w-3" /> Status
              </div>
              <div className="flex flex-wrap gap-1.5">
                {statuses.map((s) => (
                  <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>{s}</FilterChip>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[#16161a]">
            <div className="grid grid-cols-[2fr_1.4fr_1.2fr_0.8fr_1fr] px-6 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63] border-b border-[#16161a]">
              <div>Dataset</div>
              <div>Owner</div>
              <div>Last Updated</div>
              <div>Trust</div>
              <div>Status</div>
            </div>

            {filtered.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto h-12 w-12 rounded-xl bg-[rgba(255,106,31,0.08)] ring-1 ring-[rgba(255,106,31,0.18)] flex items-center justify-center">
                  <Search className="h-5 w-5 text-[#ff7a59]" />
                </div>
                <div className="mt-4 text-[14px] font-semibold text-white">No datasets match these filters</div>
                <div className="mt-1 text-[12.5px] text-[#a1a1aa]">Try clearing search or selecting "All".</div>
              </div>
            ) : (
              filtered.map((ds) => {
                const active = selected?.name === ds.name;
                return (
                  <div
                    key={ds.name}
                    onMouseEnter={() => setSelected(ds)}
                    className={[
                      "group grid grid-cols-[2fr_1.4fr_1.2fr_0.8fr_1fr_auto] items-center px-6 py-4 border-b border-[#101014] last:border-b-0 transition-colors relative",
                      active ? "bg-[#101014]" : "hover:bg-[#101014]/60",
                    ].join(" ")}
                  >
                    {active && <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r bg-[#ff4d2e] shadow-[0_0_10px_rgba(255,106,31,0.7)]" />}
                    <Link href={`/datasets/${ds.name}`} className="absolute inset-0 z-0" aria-label={`Open ${ds.name}`} />
                    <div className="relative pointer-events-none">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-medium text-white group-hover:text-[#ff7a59] transition-colors">{ds.name}</span>
                        {trustBadge(ds.trust)}
                      </div>
                      <div className="text-[11.5px] text-[#5a5a63] mt-0.5">{ds.source}</div>
                    </div>
                    <div className="relative pointer-events-none flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-[#1f1f24] flex items-center justify-center text-[10.5px] font-semibold text-[#a8a8b3]">{ds.ownerInitials}</div>
                      <span className="text-[13px] text-[#d8d8de]">{ds.ownerName}</span>
                    </div>
                    <div className="relative pointer-events-none text-[12.5px] text-[#a1a1aa]">{ds.updated}</div>
                    <div className="relative pointer-events-none"><TrustRing score={ds.trust} /></div>
                    <div className="relative pointer-events-none">
                      <span className={["inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium", statusPill(ds.status)].join(" ")}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {ds.status}
                      </span>
                    </div>
                    <ArrowUpRight className="relative pointer-events-none h-4 w-4 text-[#3a3a40] group-hover:text-[#ff7a59] transition-colors ml-2" />
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <div className="xl:sticky xl:top-24">
          {selected ? (
            <DetailPanel ds={selected} onClose={() => setSelected(null)} />
          ) : (
            <Card className="p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-[rgba(255,106,31,0.08)] ring-1 ring-[rgba(255,106,31,0.18)] flex items-center justify-center">
                <Database className="h-5 w-5 text-[#ff7a59]" />
              </div>
              <div className="mt-4 text-[14px] font-semibold text-white">Select a dataset</div>
              <div className="mt-1 text-[12.5px] text-[#a1a1aa]">Click any row to inspect ownership, checks, and lineage.</div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
