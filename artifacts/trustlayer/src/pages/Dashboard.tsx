import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Plus,
  Sparkles,
  Network,
  CheckCircle2,
  RefreshCw,
  Loader2,
  XCircle,
  Shield,
  Clock,
} from "lucide-react";
import { PageHeader, EmberButton, GhostButton } from "../components/Layout";
import { KpiCards, type Kpi } from "../components/KpiCards";
import { DatasetTable } from "../components/DatasetTable";
import { DatasetFormModal, type DatasetFormValues } from "../components/DatasetFormModal";
import { OpenMetadataModal } from "../components/OpenMetadataModal";
import { useAuth } from "../lib/auth";
import { useWorkspace } from "../lib/workspace";
import {
  datasets as demoDatasets,
  DEMO_WORKSPACE_NAME,
  DEMO_WORKSPACE_INDUSTRY,
  DEMO_WORKSPACE_TAGLINE,
  type Dataset,
} from "../lib/data";
import {
  createDataset,
  docToDataset,
  listMyDatasets,
  updateDataset,
  type DatasetDoc,
} from "../lib/datasets";
import {
  syncFromOpenMetadata,
  syncMockedMetadata,
  type SyncResult,
} from "../lib/openmetadata";

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; doc: DatasetDoc };

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

const MOCK_SYNC_STEPS = [
  "Connecting to OpenMetadata…",
  "Fetching 12 datasets…",
  "Computing trust scores…",
  "Writing to catalog…",
];

export default function Dashboard() {
  const { user } = useAuth();
  const { mode, openMetadata } = useWorkspace();
  const isDemo = mode === "demo";
  const [docs, setDocs] = useState<DatasetDoc[]>([]);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [omOpen, setOmOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [lastSyncedLabel, setLastSyncedLabel] = useState<string>("");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const greetingName = useMemo(() => {
    const n = user?.name?.trim();
    if (n) return n.split(/\s+/)[0];
    if (user?.email) return user.email.split("@")[0];
    return "there";
  }, [user]);

  useEffect(() => {
    if (!lastSynced) return;
    setLastSyncedLabel(relativeTime(lastSynced));
    tickRef.current = setInterval(() => {
      setLastSyncedLabel(relativeTime(lastSynced));
    }, 15_000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [lastSynced]);

  const load = useCallback(async () => {
    if (isDemo || !user) {
      setDocs([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listMyDatasets(user.$id);
      setDocs(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't load datasets.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    void load();
  }, [load]);

  const datasets: Dataset[] = useMemo(() => {
    if (isDemo) return [...demoDatasets].sort((a, b) => b.trust - a.trust);
    return docs.map(docToDataset).sort((a, b) => b.trust - a.trust);
  }, [docs, isDemo]);

  const counts = useMemo(() => {
    const total = datasets.length;
    const healthy = datasets.filter((d) => d.status === "Healthy").length;
    const warning = datasets.filter((d) => d.status === "Warning").length;
    const atRisk = datasets.filter((d) => d.status === "At Risk").length;
    const avg = total === 0 ? 0 : Math.round(datasets.reduce((a, d) => a + d.trust, 0) / total);
    return { total, healthy, warning, atRisk, avg };
  }, [datasets]);

  const kpis: Kpi[] = [
    {
      label: "Avg Trust Score",
      value: String(counts.avg),
      delta: counts.total === 0 ? "No datasets yet" : `Across ${counts.total} datasets`,
      icon: TrendingUp,
      tone: "ember",
    },
    {
      label: "Healthy (80–100)",
      value: String(counts.healthy),
      delta: "Reliable for reporting",
      icon: ShieldCheck,
      tone: "success",
    },
    {
      label: "Warning (60–79)",
      value: String(counts.warning),
      delta: "Usable, needs attention",
      icon: AlertTriangle,
      tone: "warning",
    },
    {
      label: "At Risk (0–59)",
      value: String(counts.atRisk),
      delta: "Review before use",
      icon: ShieldAlert,
      tone: "danger",
    },
  ];

  async function handleCreate(values: DatasetFormValues) {
    if (!user) throw new Error("You must be signed in.");
    const created = await createDataset(values, user.$id);
    setDocs((prev) => [created, ...prev]);
    setModal({ mode: "closed" });
  }

  async function handleUpdate(values: DatasetFormValues) {
    if (modal.mode !== "edit") return;
    const id = modal.doc.$id;
    const updated = await updateDataset(id, modal.doc, values);
    setDocs((prev) => prev.map((d) => (d.$id === id ? updated : d)));
    setModal({ mode: "closed" });
  }

  function openEdit(ds: Dataset) {
    if (isDemo) return;
    const doc = docs.find((d) => d.name === ds.name);
    if (doc) setModal({ mode: "edit", doc });
  }

  async function handleSync() {
    if (!user || !openMetadata) return;
    setSyncing(true);
    setSyncStep("Connecting to OpenMetadata…");
    setSyncError(null);
    setSyncResult(null);
    try {
      setSyncStep("Fetching datasets…");
      const result = await syncFromOpenMetadata(openMetadata, user.$id);
      setSyncResult(result);
      setLastSynced(new Date());
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync failed.";
      setSyncError(msg);
    } finally {
      setSyncing(false);
      setSyncStep(null);
    }
  }

  async function handleMockSync() {
    if (!user) return;
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    for (const step of MOCK_SYNC_STEPS) {
      setSyncStep(step);
      await delay(650);
    }

    try {
      const result = await syncMockedMetadata(user.$id);
      setSyncResult(result);
      setLastSynced(new Date());
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't import sample data.";
      setSyncError(msg);
    } finally {
      setSyncing(false);
      setSyncStep(null);
    }
  }

  const headerDescription = isDemo
    ? `Exploring the ${DEMO_WORKSPACE_NAME} demo · ${counts.total} sample dataset${counts.total === 1 ? "" : "s"} across the commerce stack.`
    : counts.total === 0
      ? "You don't have any datasets yet. Add one to get started."
      : `Here's the trust state of your ${counts.total} dataset${counts.total === 1 ? "" : "s"}.`;

  return (
    <>
      <PageHeader
        eyebrow={isDemo ? `Demo · ${DEMO_WORKSPACE_INDUSTRY}` : "Workspace Overview"}
        title="Good morning,"
        highlight={greetingName}
        description={headerDescription}
        actions={
          <>
            {!isDemo && openMetadata && (
              <GhostButton
                icon={syncing ? Loader2 : RefreshCw}
                onClick={() => {
                  if (!syncing) void handleSync();
                }}
              >
                {syncing ? syncStep ?? "Syncing…" : "Sync from OpenMetadata"}
              </GhostButton>
            )}
            {!isDemo && (
              <EmberButton icon={Plus} onClick={() => setModal({ mode: "create" })}>
                New dataset
              </EmberButton>
            )}
          </>
        }
      />

      {isDemo && <DemoBanner lastSyncedLabel={null} />}
      {!isDemo && (
        <UserWorkspaceBanner
          connected={!!openMetadata}
          host={openMetadata?.url}
          onConnect={() => setOmOpen(true)}
          onSync={openMetadata ? handleSync : undefined}
          onImportMock={handleMockSync}
          syncing={syncing}
          syncStep={syncStep}
          lastSyncedLabel={lastSyncedLabel || null}
        />
      )}
      {!isDemo && (syncResult || syncError) && (
        <SyncStatus
          result={syncResult}
          error={syncError}
          onDismiss={() => {
            setSyncResult(null);
            setSyncError(null);
          }}
        />
      )}

      {!isDemo && syncing && syncStep && (
        <SyncProgressBar step={syncStep} steps={MOCK_SYNC_STEPS} />
      )}

      <KpiCards items={kpis} />
      {counts.total > 0 && <ExecutiveSummaryCard counts={counts} />}
      <DatasetTable
        rows={datasets}
        loading={loading}
        error={error}
        onRetry={load}
        onEdit={isDemo ? undefined : openEdit}
        onCreate={isDemo ? undefined : () => setModal({ mode: "create" })}
        emptyTitle="No datasets yet"
        emptyDescription={
          isDemo
            ? "The demo workspace is empty for this filter."
            : "Register your first dataset to start tracking its trust score."
        }
      />

      <DatasetFormModal
        open={modal.mode !== "closed"}
        mode={modal.mode === "edit" ? "edit" : "create"}
        initial={
          modal.mode === "edit"
            ? {
                name: modal.doc.name,
                source: modal.doc.source,
                owner: modal.doc.owner,
                description: modal.doc.description,
                issue_reason: modal.doc.issue_reason,
              }
            : undefined
        }
        defaultOwner={user?.name || user?.email?.split("@")[0]}
        onClose={() => setModal({ mode: "closed" })}
        onSubmit={modal.mode === "edit" ? handleUpdate : handleCreate}
      />

      <OpenMetadataModal
        open={omOpen}
        onClose={() => setOmOpen(false)}
        onConnected={() => void handleSync()}
      />
    </>
  );
}

function SyncProgressBar({ step, steps }: { step: string; steps: string[] }) {
  const idx = steps.indexOf(step);
  const pct = idx < 0 ? 10 : Math.round(((idx + 1) / steps.length) * 100);
  return (
    <div className="rounded-xl border border-[#1f1f24] bg-[#0d0d10] px-4 py-3">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 text-[12.5px] font-medium text-white">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ff7a59]" />
          {step}
        </div>
        <span className="text-[11px] text-[#5a5a63] tabular-nums">{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-[#16161a] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ff4d2e] to-[#ff7a59] transition-all duration-500"
          style={{ width: `${pct}%`, boxShadow: "0 0 10px rgba(255,106,31,0.5)" }}
        />
      </div>
    </div>
  );
}

function ExecutiveSummaryCard({
  counts,
}: {
  counts: { total: number; healthy: number; warning: number; atRisk: number; avg: number };
}) {
  const { total, healthy, warning, atRisk, avg } = counts;
  let headline: string;
  let tone: "success" | "warning" | "danger";
  if (atRisk > 0) {
    headline = `${atRisk} dataset${atRisk === 1 ? "" : "s"} at risk — review before use in reporting.`;
    tone = "danger";
  } else if (warning > 0) {
    headline = `${warning} dataset${warning === 1 ? "" : "s"} in the warning band — ownership gaps detected.`;
    tone = "warning";
  } else {
    headline = `All ${total} datasets healthy — metadata complete, ownership assigned.`;
    tone = "success";
  }

  const borderColor =
    tone === "success"
      ? "border-[rgba(52,211,153,0.20)]"
      : tone === "warning"
        ? "border-[rgba(251,191,36,0.20)]"
        : "border-[rgba(248,113,113,0.20)]";
  const bgColor =
    tone === "success"
      ? "from-[rgba(52,211,153,0.04)]"
      : tone === "warning"
        ? "from-[rgba(251,191,36,0.04)]"
        : "from-[rgba(248,113,113,0.04)]";
  const dotColor =
    tone === "success" ? "bg-[#34d399]" : tone === "warning" ? "bg-[#fbbf24]" : "bg-[#f87171]";

  return (
    <div
      className={[
        "relative rounded-2xl border bg-gradient-to-b to-[#0a0a0d] px-5 py-4 overflow-hidden shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]",
        borderColor,
        bgColor,
      ].join(" ")}
    >
      <span className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,77,46,0.10),transparent_65%)] blur-2xl" />
      <div className="relative flex items-start gap-4">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#ff4d2e] to-[#a8260f] flex items-center justify-center shadow-[0_0_20px_rgba(255,77,46,0.30)] shrink-0 mt-0.5">
          <Shield className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10.5px] font-semibold tracking-[0.18em] uppercase bg-gradient-to-r from-[#ff7a59] to-[#ff4d2e] bg-clip-text text-transparent">
              Executive Summary
            </span>
            <span className={["h-1.5 w-1.5 rounded-full", dotColor].join(" ")} />
            <span className="text-[10.5px] text-[#5a5a63]">
              Avg trust {avg}/100 · {total} datasets
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] font-medium text-white leading-snug">{headline}</p>
          <p className="mt-1 text-[11.5px] text-[#6a6a73] leading-relaxed">
            Transforming OpenMetadata into actionable trust intelligence. {healthy} healthy · {warning} warning · {atRisk} at risk.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-[24px] font-semibold tabular-nums text-white leading-none">{avg}</div>
            <div className="text-[10px] text-[#5a5a63] mt-1 uppercase tracking-wide">avg score</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SyncStatus({
  result,
  error,
  onDismiss,
}: {
  result: SyncResult | null;
  error: string | null;
  onDismiss: () => void;
}) {
  if (error) {
    return (
      <div className="rounded-xl border border-[rgba(248,113,113,0.28)] bg-[rgba(248,113,113,0.06)] px-4 py-3 flex items-start gap-3">
        <span className="h-8 w-8 rounded-lg bg-[rgba(248,113,113,0.10)] ring-1 ring-[rgba(248,113,113,0.28)] flex items-center justify-center shrink-0">
          <XCircle className="h-4 w-4 text-[#f87171]" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold text-white">Sync failed</div>
          <div className="text-[11.5px] text-[#fca5a5] mt-0.5 break-words">{error}</div>
        </div>
        <button onClick={onDismiss} className="text-[11px] text-[#a1a1aa] hover:text-white transition-colors shrink-0">
          Dismiss
        </button>
      </div>
    );
  }
  if (!result) return null;
  const { total, created, updated, failed } = result;
  return (
    <div className="rounded-xl border border-[rgba(52,211,153,0.28)] bg-[rgba(52,211,153,0.05)] px-4 py-3 flex items-start gap-3">
      <span className="h-8 w-8 rounded-lg bg-[rgba(52,211,153,0.10)] ring-1 ring-[rgba(52,211,153,0.28)] flex items-center justify-center shrink-0">
        <CheckCircle2 className="h-4 w-4 text-[#34d399]" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-white">
          {total} dataset{total === 1 ? "" : "s"} synced successfully
        </div>
        <div className="text-[11.5px] text-[#a1a1aa] mt-0.5">
          {created} new · {updated} updated{failed > 0 ? ` · ${failed} failed` : ""}
          {failed === 0 ? " — catalog is up to date." : ""}
        </div>
        {failed > 0 && result.errors.length > 0 && (
          <div className="mt-1.5 text-[11px] text-[#fca5a5] truncate">
            First error: {result.errors[0]}
          </div>
        )}
      </div>
      <button onClick={onDismiss} className="text-[11px] text-[#a1a1aa] hover:text-white transition-colors shrink-0">
        Dismiss
      </button>
    </div>
  );
}

function DemoBanner({ lastSyncedLabel }: { lastSyncedLabel: string | null }) {
  return (
    <div className="relative rounded-xl border border-[#3a2418] bg-gradient-to-r from-[#1a1410] via-[#16110d] to-[#0d0b09] px-4 py-3 flex items-center gap-3 overflow-hidden">
      <span className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,77,46,0.18),transparent_65%)] blur-2xl" />
      <span className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-[#ff4d2e] to-[#a8260f] flex items-center justify-center shadow-[0_0_14px_rgba(255,77,46,0.35)]">
        <Sparkles className="h-4 w-4 text-white" />
      </span>
      <div className="relative flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-white">
          {DEMO_WORKSPACE_NAME}
          <span className="ml-2 text-[10.5px] font-medium uppercase tracking-[0.16em] text-[#ff7a59]">
            Demo · {DEMO_WORKSPACE_INDUSTRY}
          </span>
        </div>
        <div className="text-[11.5px] text-[#a1a1aa]">
          {DEMO_WORKSPACE_TAGLINE} Sample data is read-only — switch to Your Workspace to add or edit datasets.
        </div>
      </div>
      {lastSyncedLabel && (
        <div className="relative hidden sm:flex items-center gap-1.5 text-[11px] text-[#5a5a63] shrink-0">
          <Clock className="h-3 w-3" />
          Synced {lastSyncedLabel}
        </div>
      )}
    </div>
  );
}

function UserWorkspaceBanner({
  connected,
  host,
  onConnect,
  onSync,
  onImportMock,
  syncing,
  syncStep,
  lastSyncedLabel,
}: {
  connected: boolean;
  host?: string;
  onConnect: () => void;
  onSync?: () => void;
  onImportMock?: () => void;
  syncing?: boolean;
  syncStep?: string | null;
  lastSyncedLabel?: string | null;
}) {
  if (connected) {
    return (
      <div className="rounded-xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.05)] px-4 py-3 flex items-center gap-3">
        <span className="h-8 w-8 rounded-lg bg-[rgba(52,211,153,0.10)] ring-1 ring-[rgba(52,211,153,0.28)] flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-4 w-4 text-[#34d399]" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold text-white">Connected to OpenMetadata</div>
          <div className="text-[11.5px] text-[#a1a1aa] flex items-center gap-2 flex-wrap">
            <span className="truncate max-w-[280px]">{host}</span>
            {lastSyncedLabel && (
              <>
                <span className="text-[#3a3a40]">·</span>
                <span className="flex items-center gap-1 text-[#5a5a63]">
                  <Clock className="h-3 w-3" />
                  Last synced {lastSyncedLabel}
                </span>
              </>
            )}
          </div>
        </div>
        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="h-9 px-3 rounded-lg bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] text-white text-[12px] font-semibold shadow-[0_8px_24px_-10px_rgba(255,77,46,0.7),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:brightness-110 transition flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {syncing ? syncStep ?? "Syncing…" : "Sync now"}
          </button>
        )}
        <button
          onClick={onConnect}
          className="h-9 px-3 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[12px] font-medium text-white transition-colors"
        >
          Manage
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1f1f24] bg-[#0d0d10] px-4 py-3 flex items-center gap-3">
      <span className="h-8 w-8 rounded-lg bg-[#16161a] border border-[#1f1f24] flex items-center justify-center shrink-0">
        <Network className="h-4 w-4 text-[#ff7a59]" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-white">
          Connect OpenMetadata to ingest your catalog
        </div>
        <div className="text-[11.5px] text-[#a1a1aa]">
          Bring in datasets, owners, and lineage from your OpenMetadata workspace
          {onImportMock ? " — or import sample data to try it out." : "."}
        </div>
      </div>
      {onImportMock && (
        <button
          onClick={onImportMock}
          disabled={syncing}
          className="h-9 px-3 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[12px] font-medium text-white transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-[#ff7a59]" />
          )}
          {syncing ? syncStep ?? "Importing…" : "Import sample data"}
        </button>
      )}
      <button
        onClick={onConnect}
        className="h-9 px-3 rounded-lg bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] text-white text-[12px] font-semibold shadow-[0_8px_24px_-10px_rgba(255,77,46,0.7),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:brightness-110 transition flex items-center gap-1.5"
      >
        <Network className="h-3.5 w-3.5" />
        Connect
      </button>
    </div>
  );
}
