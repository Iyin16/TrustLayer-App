import { Plus, Upload, Database, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { PageHeader, EmberButton, GhostButton } from "../components/Layout";
import { KpiCards, type Kpi } from "../components/KpiCards";
import { DatasetTable } from "../components/DatasetTable";

const kpis: Kpi[] = [
  { label: "Connected Sources", value: "4", delta: "Snowflake · BigQuery · Postgres · Redshift", icon: Database, tone: "ember" },
  { label: "Healthy Datasets", value: "3", delta: "of 8 total", icon: ShieldCheck, tone: "success" },
  { label: "Needs Review", value: "5", delta: "warning + at risk", icon: AlertTriangle, tone: "warning" },
  { label: "Avg Freshness", value: "2.4h", delta: "since last sync", icon: Clock, tone: "danger" },
];

export default function Datasets() {
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
      <DatasetTable title="All datasets" subtitle="Showing 8 of 8 · sorted by trust score" />
    </>
  );
}
