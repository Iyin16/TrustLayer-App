import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Download,
  Plus,
} from "lucide-react";
import { PageHeader, EmberButton, GhostButton } from "../components/Layout";
import { KpiCards, type Kpi } from "../components/KpiCards";
import { DatasetTable } from "../components/DatasetTable";
import { DatasetFormModal, type DatasetFormValues } from "../components/DatasetFormModal";
import { useAuth } from "../lib/auth";
import { type Dataset } from "../lib/data";
import {
  createDataset,
  docToDataset,
  listMyDatasets,
  updateDataset,
  type DatasetDoc,
} from "../lib/datasets";

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; doc: DatasetDoc };

export default function Dashboard() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DatasetDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const greetingName = useMemo(() => {
    const n = user?.name?.trim();
    if (n) return n.split(/\s+/)[0];
    if (user?.email) return user.email.split("@")[0];
    return "there";
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
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
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const datasets: Dataset[] = useMemo(
    () => docs.map(docToDataset).sort((a, b) => b.trust - a.trust),
    [docs],
  );

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
    const updated = await updateDataset(id, values);
    setDocs((prev) => prev.map((d) => (d.$id === id ? updated : d)));
    setModal({ mode: "closed" });
  }

  function openEdit(ds: Dataset) {
    const doc = docs.find((d) => d.name === ds.name);
    if (doc) setModal({ mode: "edit", doc });
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace Overview"
        title="Good morning,"
        highlight={greetingName}
        description={
          counts.total === 0
            ? "You don't have any datasets yet. Add one to get started."
            : `Here's the trust state of your ${counts.total} dataset${counts.total === 1 ? "" : "s"}.`
        }
        actions={
          <>
            <GhostButton icon={Download}>Export report</GhostButton>
            <EmberButton icon={Plus} onClick={() => setModal({ mode: "create" })}>
              New dataset
            </EmberButton>
          </>
        }
      />
      <KpiCards items={kpis} />
      <DatasetTable
        rows={datasets}
        loading={loading}
        error={error}
        onRetry={load}
        onEdit={openEdit}
        onCreate={() => setModal({ mode: "create" })}
        emptyTitle="No datasets yet"
        emptyDescription="Register your first dataset to start tracking its trust score."
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
                trust_score: modal.doc.trust_score,
                description: modal.doc.description,
                issue_reason: modal.doc.issue_reason,
              }
            : undefined
        }
        defaultOwner={user?.name || user?.email?.split("@")[0]}
        onClose={() => setModal({ mode: "closed" })}
        onSubmit={modal.mode === "edit" ? handleUpdate : handleCreate}
      />

    </>
  );
}
