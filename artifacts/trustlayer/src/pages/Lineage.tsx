import { useState } from "react";
import {
  GitBranch,
  Workflow,
  Layers,
  Network,
  Activity,
  Clock,
  Database as DatabaseIcon,
  Users,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Play,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { PageHeader, EmberButton, GhostButton, Card } from "../components/Layout";
import { KpiCards, type Kpi } from "../components/KpiCards";

const kpis: Kpi[] = [
  { label: "Tracked Pipelines", value: "27", delta: "across 4 warehouses", icon: Workflow, tone: "ember" },
  { label: "Upstream Sources", value: "12", delta: "raw + ingested", icon: Layers, tone: "success" },
  { label: "Downstream Consumers", value: "48", delta: "dashboards · models · APIs", icon: Network, tone: "warning" },
  { label: "Broken Links", value: "2", delta: "needs attention", icon: GitBranch, tone: "danger" },
];

type NodeKind = "source" | "transform" | "consumer";
type Health = "healthy" | "warning" | "risk";

type GraphNode = {
  id: string;
  label: string;
  sub: string;
  kind: NodeKind;
  health: Health;
  x: number;
  y: number;
  trust?: number;
  owner?: string;
  lastRun?: string;
  rows?: string;
};

const nodes: GraphNode[] = [
  { id: "stripe", label: "stripe_raw", sub: "API · finance", kind: "source", health: "healthy", x: 60, y: 60, owner: "Aisha Rahman", lastRun: "8 min ago", rows: "2.4M" },
  { id: "segment", label: "segment_events", sub: "Stream · growth", kind: "source", health: "healthy", x: 60, y: 200, owner: "Marcus Chen", lastRun: "2 min ago", rows: "18.1M" },
  { id: "hubspot", label: "hubspot_export", sub: "Sync · marketing", kind: "source", health: "warning", x: 60, y: 340, owner: "Diego Alvarez", lastRun: "4 hr ago", rows: "412K" },
  { id: "oracle", label: "legacy_oracle", sub: "JDBC · legacy", kind: "source", health: "risk", x: 60, y: 480, owner: "Owen Brooks", lastRun: "2 days ago", rows: "84K" },

  { id: "ledger", label: "finance_ledger", sub: "dbt model", kind: "transform", health: "healthy", x: 380, y: 60, trust: 96, owner: "Aisha Rahman", lastRun: "8 min ago", rows: "2.4M" },
  { id: "events", label: "customer_events", sub: "dbt model", kind: "transform", health: "healthy", x: 380, y: 200, trust: 89, owner: "Marcus Chen", lastRun: "32 min ago", rows: "18.1M" },
  { id: "attrib", label: "marketing_attribution", sub: "dbt model", kind: "transform", health: "warning", x: 380, y: 340, trust: 71, owner: "Diego Alvarez", lastRun: "2 hr ago", rows: "412K" },
  { id: "legacy", label: "legacy_invoices", sub: "dbt model", kind: "transform", health: "risk", x: 380, y: 480, trust: 41, owner: "Owen Brooks", lastRun: "2 days ago", rows: "84K" },

  { id: "exec", label: "Executive Dashboard", sub: "Looker", kind: "consumer", health: "healthy", x: 720, y: 100 },
  { id: "growth", label: "Growth Funnel", sub: "Mode", kind: "consumer", health: "healthy", x: 720, y: 240 },
  { id: "campaign", label: "Campaign ROI", sub: "Tableau", kind: "consumer", health: "warning", x: 720, y: 380 },
  { id: "ar", label: "AR Aging Report", sub: "Email digest", kind: "consumer", health: "risk", x: 720, y: 500 },
];

const edges: Array<[string, string]> = [
  ["stripe", "ledger"],
  ["segment", "events"],
  ["hubspot", "attrib"],
  ["oracle", "legacy"],
  ["ledger", "exec"],
  ["events", "growth"],
  ["events", "campaign"],
  ["attrib", "campaign"],
  ["legacy", "ar"],
];

const W = 880;
const H = 580;
const NODE_W = 200;
const NODE_H = 64;

function healthDot(h: Health) {
  if (h === "healthy") return { dot: "bg-[#34d399] shadow-[0_0_8px_rgba(52,211,153,0.7)]", text: "text-[#34d399]", label: "Healthy", icon: CheckCircle2 };
  if (h === "warning") return { dot: "bg-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.7)]", text: "text-[#fbbf24]", label: "Warning", icon: AlertTriangle };
  return { dot: "bg-[#f87171] shadow-[0_0_8px_rgba(248,113,113,0.7)]", text: "text-[#f87171]", label: "At Risk", icon: AlertTriangle };
}

function edgeColor(h: Health) {
  if (h === "risk") return "rgba(248,113,113,0.5)";
  if (h === "warning") return "rgba(251,191,36,0.5)";
  return "rgba(255,138,74,0.45)";
}

function nodeFor(id: string) {
  return nodes.find((n) => n.id === id)!;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.15;

export default function Lineage() {
  const [selectedId, setSelectedId] = useState<string>("attrib");
  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
  const zoomReset = () => setZoom(1);
  const selected = nodeFor(selectedId);
  const upstream = edges.filter(([, t]) => t === selectedId).map(([s]) => nodeFor(s));
  const downstream = edges.filter(([s]) => s === selectedId).map(([, t]) => nodeFor(t));
  const sh = healthDot(selected.health);
  const SIcon = sh.icon;

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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        <Card>
          <div className="px-6 pt-6 pb-4 flex items-end justify-between gap-4 flex-wrap border-b border-[#16161a]">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight">Mission control</h2>
              <p className="mt-1 text-[12.5px] text-[#8a8a93]">12 sources · 8 transforms · 4 consumers</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#8a8a93]">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#34d399] shadow-[0_0_6px_rgba(52,211,153,0.7)]" />Healthy</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24] shadow-[0_0_6px_rgba(251,191,36,0.7)]" />Warning</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#f87171] shadow-[0_0_6px_rgba(248,113,113,0.7)]" />At risk</span>
            </div>
          </div>

          <div className="relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.5]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <span className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,106,31,0.12),transparent_70%)] blur-2xl" />
            <span className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,138,74,0.08),transparent_70%)] blur-2xl" />

            <div className="absolute top-3 right-3 z-10 flex flex-col rounded-lg border border-[#1f1f24] bg-[#0d0d10]/90 backdrop-blur shadow-[0_10px_30px_-12px_rgba(0,0,0,0.9)] overflow-hidden">
              <button
                onClick={zoomIn}
                disabled={zoom >= ZOOM_MAX}
                className="h-9 w-9 flex items-center justify-center text-[#c8c8d0] hover:text-white hover:bg-[#16161a] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="h-px bg-[#16161a]" />
              <button
                onClick={zoomOut}
                disabled={zoom <= ZOOM_MIN}
                className="h-9 w-9 flex items-center justify-center text-[#c8c8d0] hover:text-white hover:bg-[#16161a] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <div className="h-px bg-[#16161a]" />
              <button
                onClick={zoomReset}
                className="h-9 w-9 flex items-center justify-center text-[#c8c8d0] hover:text-white hover:bg-[#16161a] transition-colors"
                title="Reset zoom"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
            <div className="absolute bottom-3 right-3 z-10 px-2 py-1 rounded-md border border-[#1f1f24] bg-[#0d0d10]/90 backdrop-blur text-[10.5px] font-medium text-[#8a8a93]">
              {Math.round(zoom * 100)}%
            </div>

            <div className="relative overflow-auto" style={{ height: H + 24 }}>
              <div
                className="relative origin-top-left transition-transform"
                style={{
                  width: W * zoom,
                  height: H * zoom,
                }}
              >
              <div className="relative origin-top-left" style={{ width: W, height: H, minWidth: W, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
                <svg className="absolute inset-0 pointer-events-none" width={W} height={H}>
                  <defs>
                    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M0,0 L10,5 L0,10 Z" fill="rgba(255,138,74,0.6)" />
                    </marker>
                  </defs>
                  {edges.map(([s, t], i) => {
                    const a = nodeFor(s);
                    const b = nodeFor(t);
                    const x1 = a.x + NODE_W;
                    const y1 = a.y + NODE_H / 2;
                    const x2 = b.x;
                    const y2 = b.y + NODE_H / 2;
                    const cx = (x1 + x2) / 2;
                    const isActive = s === selectedId || t === selectedId;
                    const stroke = edgeColor(b.health);
                    return (
                      <path
                        key={i}
                        d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke={isActive ? "#ff8a4a" : stroke}
                        strokeWidth={isActive ? 2 : 1.25}
                        strokeOpacity={isActive ? 0.95 : 0.6}
                        markerEnd="url(#arr)"
                        style={isActive ? { filter: "drop-shadow(0 0 4px rgba(255,106,31,0.7))" } : undefined}
                      />
                    );
                  })}
                </svg>

                {nodes.map((n) => {
                  const h = healthDot(n.health);
                  const active = n.id === selectedId;
                  const kindLabel = n.kind === "source" ? "SOURCE" : n.kind === "transform" ? "MODEL" : "CONSUMER";
                  return (
                    <button
                      key={n.id}
                      onClick={() => setSelectedId(n.id)}
                      style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
                      className={[
                        "absolute text-left rounded-xl border bg-gradient-to-b from-[#121215] to-[#0a0a0d] px-3.5 py-2.5 transition-all overflow-hidden",
                        active
                          ? "border-[#3a2418] shadow-[inset_0_1px_0_0_rgba(255,138,74,0.18),0_0_0_1px_rgba(255,106,31,0.4),0_18px_36px_-18px_rgba(255,106,31,0.6)]"
                          : "border-[#1f1f24] hover:border-[#2a2a30] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_18px_30px_-20px_rgba(0,0,0,0.9)]",
                      ].join(" ")}
                    >
                      {active && <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(180px_60px_at_0%_50%,rgba(255,106,31,0.18),transparent_70%)]" />}
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                      <div className="relative flex items-center justify-between">
                        <div className="text-[9.5px] font-semibold tracking-[0.16em] text-[#5a5a63]">{kindLabel}</div>
                        <span className={["h-1.5 w-1.5 rounded-full", h.dot].join(" ")} />
                      </div>
                      <div className="relative mt-1 text-[12.5px] font-semibold text-white truncate">{n.label}</div>
                      <div className="relative text-[10.5px] text-[#8a8a93] truncate">{n.sub}</div>
                    </button>
                  );
                })}
              </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:sticky lg:top-24 space-y-5">
          <Card className="p-0 overflow-hidden">
            <div className="relative px-6 pt-6 pb-5 border-b border-[#16161a]">
              <span className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,106,31,0.18),transparent_65%)] blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-[#5a5a63]">Inspector</div>
                <span className={["inline-flex items-center gap-1.5 text-[11px] font-medium", sh.text].join(" ")}>
                  <SIcon className="h-3.5 w-3.5" /> {sh.label}
                </span>
              </div>
              <h3 className="relative mt-2 text-[20px] font-semibold tracking-tight text-white">{selected.label}</h3>
              <div className="relative mt-1 text-[12.5px] text-[#8a8a93]">{selected.sub}</div>

              {selected.trust !== undefined && (
                <div className="relative mt-4 flex items-center gap-3 rounded-lg border border-[#1f1f24] bg-[#0d0d10] px-3.5 py-2.5">
                  <Activity className="h-4 w-4 text-[#ff8a4a]" />
                  <div>
                    <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#5a5a63] font-semibold">Trust score</div>
                    <div className="text-[14px] font-semibold text-white">{selected.trust}/100</div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {selected.owner && (
                  <div className="rounded-lg border border-[#1f1f24] bg-[#0d0d10] p-3">
                    <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-[#5a5a63] font-semibold"><Users className="h-3 w-3" /> Owner</div>
                    <div className="mt-1.5 text-[12.5px] text-white">{selected.owner}</div>
                  </div>
                )}
                {selected.lastRun && (
                  <div className="rounded-lg border border-[#1f1f24] bg-[#0d0d10] p-3">
                    <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-[#5a5a63] font-semibold"><Clock className="h-3 w-3" /> Last run</div>
                    <div className="mt-1.5 text-[12.5px] text-white">{selected.lastRun}</div>
                  </div>
                )}
                {selected.rows && (
                  <div className="rounded-lg border border-[#1f1f24] bg-[#0d0d10] p-3">
                    <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-[#5a5a63] font-semibold"><DatabaseIcon className="h-3 w-3" /> Rows</div>
                    <div className="mt-1.5 text-[12.5px] text-white">{selected.rows}</div>
                  </div>
                )}
                <div className="rounded-lg border border-[#1f1f24] bg-[#0d0d10] p-3">
                  <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-[#5a5a63] font-semibold"><Layers className="h-3 w-3" /> Type</div>
                  <div className="mt-1.5 text-[12.5px] text-white capitalize">{selected.kind}</div>
                </div>
              </div>

              <div>
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#5a5a63] font-semibold mb-2">Upstream ({upstream.length})</div>
                <div className="space-y-1.5">
                  {upstream.length === 0 && <div className="text-[12px] text-[#5a5a63]">No upstream dependencies.</div>}
                  {upstream.map((u) => (
                    <button key={u.id} onClick={() => setSelectedId(u.id)} className="w-full flex items-center justify-between rounded-lg border border-[#1f1f24] bg-[#0a0a0d] px-3 py-2 hover:bg-[#101014] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={["h-1.5 w-1.5 rounded-full", healthDot(u.health).dot].join(" ")} />
                        <span className="text-[12.5px] text-white">{u.label}</span>
                      </div>
                      <span className="text-[11px] text-[#5a5a63]">{u.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#5a5a63] font-semibold mb-2">Downstream ({downstream.length})</div>
                <div className="space-y-1.5">
                  {downstream.length === 0 && <div className="text-[12px] text-[#5a5a63]">No downstream consumers.</div>}
                  {downstream.map((d) => (
                    <button key={d.id} onClick={() => setSelectedId(d.id)} className="w-full flex items-center justify-between rounded-lg border border-[#1f1f24] bg-[#0a0a0d] px-3 py-2 hover:bg-[#101014] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={["h-1.5 w-1.5 rounded-full", healthDot(d.health).dot].join(" ")} />
                        <span className="text-[12.5px] text-white">{d.label}</span>
                      </div>
                      <span className="text-[11px] text-[#5a5a63]">{d.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <EmberButton icon={Play}>Run pipeline</EmberButton>
                <GhostButton icon={ExternalLink}>Open in dbt</GhostButton>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
