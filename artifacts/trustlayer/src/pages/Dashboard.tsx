import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Download,
  Plus,
  Sparkles,
  Network,
  CheckCircle2,
  RefreshCw,
  Loader2,
  XCircle,
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
import { syncFromOpenMetadata, type SyncResult } from "../lib/openmetadata";

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; doc: DatasetDoc };

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
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const greetingName = useMemo(() => {
    const n = user?.name?.trim();
    if (n) return n.split(/\s+/)[0];
    if (user?.email) return user.email.split("@")[0];
    return "there";
  }, [user]);

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
    setSyncError(null);
    setSyncResult(null);
    try {
      const result = await syncFromOpenMetadata(openMetadata, user.$id);
      setSyncResult(result);
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync failed.";
      setSyncError(msg);
    } finally {
      setSyncing(false);
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
            <GhostButton icon={Download}>Export report</GhostButton>
            {!isDemo && openMetadata && (
              <GhostButton
                icon={syncing ? Loader2 : RefreshCw}
                onClick={() => {
                  if (!syncing) void handleSync();
                }}
              >
                {syncing ? "Syncing…" : "Sync from OpenMetadata"}
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

      {isDemo && <DemoBanner />}
      {!isDemo && <UserWorkspaceBanner
        connected={!!openMetadata}
        host={openMetadata?.url}
        onConnect={() => setOmOpen(true)}
        onSync={openMetadata ? handleSync : undefined}
        syncing={syncing}
      />}
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

      <KpiCards items={kpis} />
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
          <div className="text-[12.5px] font-semibold text-white">OpenMetadata sync failed</div>
          <div className="text-[11.5px] text-[#fca5a5] mt-0.5 break-words">{error}</div>
        </div>
        <button
          onClick={onDismiss}
          className="text-[11px] text-[#a1a1aa] hover:text-white transition-colors"
        >
          Dismiss
        </button>
      </div>
    );
  }
  if (!result) return null;
  const { total, created, updated, failed } = result;
  return (
    <div className="rounded-xl border border-[rgba(255,138,74,0.28)] bg-[rgba(255,138,74,0.06)] px-4 py-3 flex items-start gap-3">
      <span className="h-8 w-8 rounded-lg bg-[rgba(255,138,74,0.10)] ring-1 ring-[rgba(255,138,74,0.28)] flex items-center justify-center shrink-0">
        <CheckCircle2 className="h-4 w-4 text-[#ff7a59]" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-white">
          OpenMetadata sync complete
        </div>
        <div className="text-[11.5px] text-[#a1a1aa] mt-0.5">
          {total} table{total === 1 ? "" : "s"} fetched · {created} new · {updated} updated
          {failed > 0 ? ` · ${failed} failed` : ""}
        </div>
        {failed > 0 && result.errors.length > 0 && (
          <div className="mt-1.5 text-[11px] text-[#fca5a5] truncate">
            First error: {result.errors[0]}
          </div>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-[11px] text-[#a1a1aa] hover:text-white transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}

function DemoBanner() {
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
          {DEMO_WORKSPACE_TAGLINE} Sample data is read-only — switch to Your Workspace to
          add or edit datasets.
        </div>
      </div>
    </div>
  );
}

function UserWorkspaceBanner({
  connected,
  host,
  onConnect,
  onSync,
  syncing,
}: {
  connected: boolean;
  host?: string;
  onConnect: () => void;
  onSync?: () => void;
  syncing?: boolean;
}) {
  if (connected) {
    return (
      <div className="rounded-xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.05)] px-4 py-3 flex items-center gap-3">
        <span className="h-8 w-8 rounded-lg bg-[rgba(52,211,153,0.10)] ring-1 ring-[rgba(52,211,153,0.28)] flex items-center justify-center">
          <CheckCircle2 className="h-4 w-4 text-[#34d399]" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold text-white">
            Connected to OpenMetadata
          </div>
          <div className="text-[11.5px] text-[#a1a1aa] truncate">{host}</div>
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
            {syncing ? "Syncing…" : "Sync now"}
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
      <span className="h-8 w-8 rounded-lg bg-[#16161a] border border-[#1f1f24] flex items-center justify-center">
        <Network className="h-4 w-4 text-[#ff7a59]" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-white">
          Connect OpenMetadata to ingest your catalog
        </div>
        <div className="text-[11.5px] text-[#a1a1aa]">
          Bring in datasets, owners, and lineage from your existing OpenMetadata workspace.
        </div>
      </div>
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
