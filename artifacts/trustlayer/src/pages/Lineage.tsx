import { GitBranch, Workflow, ArrowRight, Layers, Network } from "lucide-react";
import { PageHeader, EmberButton, GhostButton, Card } from "../components/Layout";
import { KpiCards, type Kpi } from "../components/KpiCards";

const kpis: Kpi[] = [
  { label: "Tracked Pipelines", value: "27", delta: "across 4 warehouses", icon: Workflow, tone: "ember" },
  { label: "Upstream Sources", value: "12", delta: "raw + ingested", icon: Layers, tone: "success" },
  { label: "Downstream Consumers", value: "48", delta: "dashboards · models · APIs", icon: Network, tone: "warning" },
  { label: "Broken Links", value: "2", delta: "needs attention", icon: GitBranch, tone: "danger" },
];

type Flow = {
  source: string;
  steps: string[];
  consumers: string;
  health: "Healthy" | "Warning" | "At Risk";
};

const flows: Flow[] = [
  { source: "stripe_raw", steps: ["finance_ledger", "revenue_daily"], consumers: "8 dashboards", health: "Healthy" },
  { source: "segment_events", steps: ["customer_events", "growth_funnel"], consumers: "12 dashboards · 3 ML models", health: "Healthy" },
  { source: "shopify_api", steps: ["product_catalog", "inventory_snapshot"], consumers: "5 dashboards", health: "Warning" },
  { source: "hubspot_export", steps: ["marketing_attribution"], consumers: "4 dashboards · 1 model", health: "Warning" },
  { source: "legacy_oracle", steps: ["legacy_invoices"], consumers: "2 reports", health: "At Risk" },
];

function healthDot(h: Flow["health"]) {
  if (h === "Healthy") return "bg-[#34d399] shadow-[0_0_8px_rgba(52,211,153,0.7)]";
  if (h === "Warning") return "bg-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.7)]";
  return "bg-[#f87171] shadow-[0_0_8px_rgba(248,113,113,0.7)]";
}

export default function Lineage() {
  return (
    <>
      <PageHeader
        eyebrow="Data Flow"
        title="Lineage"
        description="Trace how data moves from raw sources to the dashboards your team relies on."
        actions={
          <>
            <GhostButton icon={GitBranch}>Compare runs</GhostButton>
            <EmberButton icon={Workflow}>Trace pipeline</EmberButton>
          </>
        }
      />
      <KpiCards items={kpis} />

      <Card>
        <div className="px-6 pt-6 pb-5">
          <h2 className="text-[18px] font-semibold tracking-tight">Active pipelines</h2>
          <p className="mt-1 text-[12.5px] text-[#8a8a93]">5 of 27 pipelines · grouped by source system</p>
        </div>
        <div className="border-t border-[#16161a]">
          {flows.map((flow) => (
            <div
              key={flow.source}
              className="px-6 py-5 border-b border-[#101014] last:border-b-0 hover:bg-[#101014]/60 transition-colors"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={["h-2 w-2 rounded-full", healthDot(flow.health)].join(" ")} />
                  <div className="px-2.5 py-1 rounded-md border border-[#2a2a30] bg-[#0d0d10] text-[12.5px] font-medium text-white">
                    {flow.source}
                  </div>
                  {flow.steps.map((step) => (
                    <div key={step} className="flex items-center gap-2">
                      <ArrowRight className="h-3.5 w-3.5 text-[#5a5a63]" />
                      <div className="px-2.5 py-1 rounded-md border border-[#1f1f24] bg-[#0a0a0d] text-[12.5px] text-[#d8d8de]">
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-[12px] text-[#8a8a93]">{flow.consumers}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
