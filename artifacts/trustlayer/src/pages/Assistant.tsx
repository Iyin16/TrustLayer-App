import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Wrench,
  TrendingDown,
  Database,
  Loader2,
  Lightbulb,
} from "lucide-react";
import { PageHeader, Card } from "../components/Layout";
import { TrustRing } from "../components/TrustRing";
import { useAuth } from "../lib/auth";
import { useWorkspace } from "../lib/workspace";
import { datasets as demoDatasets, type Dataset } from "../lib/data";
import { docToDataset, listMyDatasets } from "../lib/datasets";
import {
  bandFor,
  bandLabel,
  detectIssues,
  explainRisk,
  fixSuggestions,
  systemHealthSummary,
  toMeta,
  topRiskyDatasets,
  type RiskBand,
} from "../lib/insights";

function bandPill(band: RiskBand) {
  if (band === "healthy") {
    return "text-[#34d399] bg-[rgba(52,211,153,0.10)] border-[rgba(52,211,153,0.28)]";
  }
  if (band === "moderate") {
    return "text-[#fbbf24] bg-[rgba(251,191,36,0.10)] border-[rgba(251,191,36,0.28)]";
  }
  return "text-[#f87171] bg-[rgba(248,113,113,0.10)] border-[rgba(248,113,113,0.28)]";
}

function bandIcon(band: RiskBand) {
  if (band === "healthy") return ShieldCheck;
  if (band === "moderate") return AlertTriangle;
  return ShieldAlert;
}

export default function Assistant() {
  const { user } = useAuth();
  const { mode } = useWorkspace();
  const isDemo = mode === "demo";
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [explainOpen, setExplainOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (isDemo) {
        setDatasets([...demoDatasets]);
        setLoading(false);
        return;
      }
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const docs = await listMyDatasets(user.$id);
        if (cancelled) return;
        setDatasets(docs.map(docToDataset));
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Couldn't load datasets.";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [user, isDemo]);

  const metas = useMemo(() => datasets.map(toMeta), [datasets]);
  const summary = useMemo(() => systemHealthSummary(metas), [metas]);
  const risky = useMemo(() => topRiskyDatasets(metas, 3), [metas]);

  const sortedForSelect = useMemo(
    () => [...metas].sort((a, b) => a.trust_score - b.trust_score),
    [metas],
  );

  // Default selection: lowest-scoring dataset
  useEffect(() => {
    if (selectedName) return;
    if (sortedForSelect.length > 0) {
      setSelectedName(sortedForSelect[0].name);
    }
  }, [sortedForSelect, selectedName]);

  const selected = useMemo(
    () => sortedForSelect.find((d) => d.name === selectedName) || null,
    [sortedForSelect, selectedName],
  );

  return (
    <>
      <PageHeader
        eyebrow="Trust Explainer"
        title="AI"
        highlight="Assistant"
        description="Plain-language explanations of dataset risk, system health, and how to fix issues — grounded only in your own metadata."
      />

      {loading && (
        <Card className="p-6 flex items-center gap-3 text-[13px] text-[#a1a1aa]">
          <Loader2 className="h-4 w-4 animate-spin text-[#ff7a59]" />
          Loading your datasets…
        </Card>
      )}

      {error && (
        <Card className="p-6 text-[13px] text-[#fca5a5]">{error}</Card>
      )}

      {!loading && !error && metas.length === 0 && (
        <Card className="p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] flex items-center justify-center shadow-[0_12px_30px_-8px_rgba(255,106,31,0.6)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h2 className="mt-4 text-[20px] font-semibold tracking-tight text-white">
            Add a dataset to get insights
          </h2>
          <p className="mt-1.5 text-[13px] text-[#9a9aa3] max-w-md mx-auto">
            The Trust Explainer reads your registered datasets and explains
            risk in plain language. Register one from the dashboard to get
            started.
          </p>
        </Card>
      )}

      {!loading && !error && metas.length > 0 && (
        <>
          <SystemHealthCard summary={summary} risky={risky} />

          <Card className="p-6">
            <div className="flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-lg bg-[rgba(255,106,31,0.08)] ring-1 ring-[rgba(255,106,31,0.18)] flex items-center justify-center shrink-0">
                <Database className="h-4 w-4 text-[#ff7a59]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold tracking-tight text-white">
                  Explain a dataset
                </h3>
                <p className="mt-0.5 text-[12.5px] text-[#a1a1aa]">
                  Pick a dataset to get a short, plain-language risk
                  explanation based on its metadata.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
              <label className="block">
                <div className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-[#5a5a63] mb-1.5">
                  Dataset
                </div>
                <select
                  value={selectedName ?? ""}
                  onChange={(e) => {
                    setSelectedName(e.target.value);
                    setExplainOpen(false);
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#0a0a0d] border border-[#1f1f24] text-[13.5px] text-white focus:outline-none focus:border-[#3a2418] focus:ring-2 focus:ring-[rgba(255,77,46,0.12)] transition-colors"
                >
                  {sortedForSelect.map((d) => (
                    <option key={d.name} value={d.name} className="bg-[#0d0d10]">
                      {d.name} · {d.trust_score}/100 ·{" "}
                      {bandLabel(bandFor(d.trust_score))}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => setExplainOpen(true)}
                disabled={!selected}
                className="h-11 px-4 rounded-xl bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-[0_10px_24px_-6px_rgba(255,106,31,0.55),0_0_0_1px_rgba(255,138,74,0.4)_inset,0_1px_0_0_rgba(255,255,255,0.25)_inset] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                Explain Risk
              </button>
            </div>

            {selected && explainOpen && (
              <ExplanationPanel
                meta={selected}
                onClose={() => setExplainOpen(false)}
              />
            )}
          </Card>
        </>
      )}
    </>
  );
}

function SystemHealthCard({
  summary,
  risky,
}: {
  summary: ReturnType<typeof systemHealthSummary>;
  risky: ReturnType<typeof topRiskyDatasets>;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3.5">
        <div className="h-9 w-9 rounded-lg bg-[rgba(255,106,31,0.08)] ring-1 ring-[rgba(255,106,31,0.18)] flex items-center justify-center shrink-0">
          <TrendingDown className="h-4 w-4 text-[#ff7a59]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight text-white">
            System Health Summary
          </h3>
          <p className="mt-0.5 text-[12.5px] text-[#a1a1aa]">
            {summary.oneLiner}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <TrustRing score={summary.avg} size={56} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Stat label="Total" value={summary.total} tone="muted" />
        <Stat label="Healthy" value={summary.healthy} tone="success" />
        <Stat label="Warning" value={summary.warning} tone="warning" />
        <Stat label="At Risk" value={summary.atRisk} tone="danger" />
      </div>

      {risky.length > 0 && (
        <>
          <div className="mt-6 mb-3 text-[10.5px] font-semibold tracking-[0.14em] uppercase text-[#5a5a63]">
            Top {risky.length} risky dataset{risky.length === 1 ? "" : "s"}
          </div>
          <div className="space-y-2.5">
            {risky.map((m) => {
              const explained = explainRisk(m);
              const Icon = bandIcon(explained.band);
              return (
                <div
                  key={m.name}
                  className="rounded-xl border border-[#1f1f24] bg-[#0a0a0d] p-4 flex items-start gap-3"
                >
                  <TrustRing score={m.trust_score} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13.5px] font-semibold text-white">
                        {m.name}
                      </span>
                      <span
                        className={[
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium border",
                          bandPill(explained.band),
                        ].join(" ")}
                      >
                        <Icon className="h-3 w-3" />
                        {bandLabel(explained.band)}
                      </span>
                      <span className="text-[11px] text-[#5a5a63]">
                        {m.source}
                        {m.owner ? ` · ${m.owner}` : " · no owner"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] text-[#c8c8d0] leading-relaxed">
                      {explained.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger" | "muted";
}) {
  const map: Record<typeof tone, string> = {
    success:
      "text-[#34d399] bg-[rgba(52,211,153,0.06)] border-[rgba(52,211,153,0.20)]",
    warning:
      "text-[#fbbf24] bg-[rgba(251,191,36,0.06)] border-[rgba(251,191,36,0.20)]",
    danger:
      "text-[#f87171] bg-[rgba(248,113,113,0.06)] border-[rgba(248,113,113,0.22)]",
    muted: "text-white bg-[#0a0a0d] border-[#1f1f24]",
  };
  return (
    <div className={["rounded-xl border px-3 py-2.5", map[tone]].join(" ")}>
      <div className="text-[18px] font-semibold tabular-nums leading-none">
        {value}
      </div>
      <div className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.12em] opacity-80">
        {label}
      </div>
    </div>
  );
}

function ExplanationPanel({
  meta,
  onClose,
}: {
  meta: ReturnType<typeof toMeta>;
  onClose: () => void;
}) {
  const explained = explainRisk(meta);
  const Icon = bandIcon(explained.band);
  const issues = detectIssues(meta);
  const tips = fixSuggestions(meta);

  return (
    <div className="mt-6 rounded-2xl border border-[#1f1f24] bg-[#08080a] overflow-hidden">
      <div
        className={[
          "px-5 py-4 flex items-start gap-3 border-b border-[#1f1f24]",
          explained.band === "healthy"
            ? "bg-[rgba(52,211,153,0.04)]"
            : explained.band === "moderate"
              ? "bg-[rgba(251,191,36,0.04)]"
              : "bg-[rgba(248,113,113,0.04)]",
        ].join(" ")}
      >
        <TrustRing score={meta.trust_score} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={[
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium border",
                bandPill(explained.band),
              ].join(" ")}
            >
              <Icon className="h-3 w-3" />
              {bandLabel(explained.band)}
            </span>
            <span className="text-[11px] text-[#5a5a63]">
              Trust score {meta.trust_score}/100
            </span>
          </div>
          <h4 className="mt-1.5 text-[14.5px] font-semibold text-white">
            {explained.headline}
          </h4>
        </div>
        <button
          onClick={onClose}
          className="text-[11px] text-[#a1a1aa] hover:text-white transition-colors"
        >
          Close
        </button>
      </div>

      <div className="px-5 py-4">
        <p className="text-[13px] text-[#e0e0e7] leading-relaxed">
          {explained.body}
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <MetadataChip label="Source" value={meta.source || "—"} />
          <MetadataChip label="Owner" value={meta.owner || "Unassigned"} />
          <MetadataChip
            label="Status"
            value={bandLabel(bandFor(meta.trust_score))}
          />
        </div>

        {issues.length > 0 && (
          <div className="mt-5">
            <div className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-[#5a5a63] mb-2">
              Detected issues
            </div>
            <div className="flex flex-wrap gap-1.5">
              {issues.map((i) => (
                <span
                  key={i.code}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-[#2a2a30] bg-[#0d0d10] text-[#c8c8d0]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a59]" />
                  {i.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 rounded-xl border border-[#1f1f24] bg-[#0a0a0d] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-[rgba(255,106,31,0.10)] ring-1 ring-[rgba(255,106,31,0.20)] flex items-center justify-center">
              <Wrench className="h-3.5 w-3.5 text-[#ff7a59]" />
            </div>
            <span className="text-[12.5px] font-semibold text-white">
              Fix suggestions
            </span>
          </div>
          <ul className="space-y-1.5 mt-1.5">
            {tips.map((t, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[12.5px] text-[#c8c8d0] leading-relaxed"
              >
                <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-[#ff7a59] shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MetadataChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1f1f24] bg-[#0a0a0d] px-3 py-2.5">
      <div className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-[#5a5a63]">
        {label}
      </div>
      <div className="mt-1 text-[13px] font-medium text-white truncate">
        {value}
      </div>
    </div>
  );
}
