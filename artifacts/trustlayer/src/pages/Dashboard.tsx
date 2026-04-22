import { TrendingUp, ShieldCheck, AlertTriangle, ShieldAlert, Download, Plus } from "lucide-react";
import { PageHeader, EmberButton, GhostButton } from "../components/Layout";
import { KpiCards, type Kpi } from "../components/KpiCards";
import { DatasetTable } from "../components/DatasetTable";
import { datasets, trustCounts } from "../lib/data";

const total = datasets.length;
const kpis: Kpi[] = [
  { label: "Avg Trust Score", value: String(trustCounts.avg), delta: `Across ${total} datasets`, icon: TrendingUp, tone: "ember" },
  { label: "Healthy (80–100)", value: String(trustCounts.healthy), delta: "Reliable for reporting", icon: ShieldCheck, tone: "success" },
  { label: "Warning (60–79)", value: String(trustCounts.warning), delta: "Usable, needs attention", icon: AlertTriangle, tone: "warning" },
  { label: "At Risk (0–59)", value: String(trustCounts.atRisk), delta: "Review before use", icon: ShieldAlert, tone: "danger" },
];

export default function Dashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Workspace Overview"
        title="Good morning,"
        highlight="Alex"
        description="Here's the trust state of your data across 4 warehouses."
        actions={
          <>
            <GhostButton icon={Download}>Export report</GhostButton>
            <EmberButton icon={Plus}>New dataset</EmberButton>
          </>
        }
      />
      <KpiCards items={kpis} />
      <DatasetTable />
    </>
  );
}
