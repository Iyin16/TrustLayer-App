import { Database as DatabaseIcon, TrendingUp, AlertTriangle, Activity, Download, Plus } from "lucide-react";
import { PageHeader, EmberButton, GhostButton } from "../components/Layout";
import { KpiCards, type Kpi } from "../components/KpiCards";
import { DatasetTable } from "../components/DatasetTable";

const kpis: Kpi[] = [
  { label: "Total Datasets", value: "8", delta: "+12 this month", icon: DatabaseIcon, tone: "ember" },
  { label: "Avg Trust Score", value: "74", delta: "+3.2 vs last week", icon: TrendingUp, tone: "success" },
  { label: "Risk Alerts", value: "4", delta: "2 new today", icon: AlertTriangle, tone: "danger" },
  { label: "Freshness Health", value: "71%", delta: "Stable", icon: Activity, tone: "warning" },
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
