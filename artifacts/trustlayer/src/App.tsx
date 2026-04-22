import {
  Shield,
  LayoutGrid,
  Database,
  GitBranch,
  Sparkles,
  Search,
  Bell,
  Settings,
  Download,
  Plus,
  Database as DatabaseIcon,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  Filter,
} from "lucide-react";

type NavItem = { label: string; icon: React.ComponentType<{ className?: string }>; active?: boolean };

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutGrid, active: true },
  { label: "Datasets", icon: Database },
  { label: "Lineage", icon: GitBranch },
  { label: "AI Assistant", icon: Sparkles },
];

type Kpi = {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "ember" | "success" | "danger" | "warning";
};

const kpis: Kpi[] = [
  { label: "Total Datasets", value: "8", delta: "+12 this month", icon: DatabaseIcon, tone: "ember" },
  { label: "Avg Trust Score", value: "74", delta: "+3.2 vs last week", icon: TrendingUp, tone: "success" },
  { label: "Risk Alerts", value: "4", delta: "2 new today", icon: AlertTriangle, tone: "danger" },
  { label: "Freshness Health", value: "71%", delta: "Stable", icon: Activity, tone: "warning" },
];

type Dataset = {
  name: string;
  source: string;
  domain: string;
  ownerName: string;
  ownerInitials: string;
  updated: string;
  trust: number;
  status: "Healthy" | "Warning" | "At Risk";
};

const datasets: Dataset[] = [
  { name: "finance_ledger", source: "Snowflake", domain: "finance", ownerName: "Aisha Rahman", ownerInitials: "AR", updated: "8 minutes ago", trust: 96, status: "Healthy" },
  { name: "customer_events", source: "BigQuery", domain: "growth", ownerName: "Marcus Chen", ownerInitials: "MC", updated: "32 minutes ago", trust: 89, status: "Healthy" },
  { name: "product_catalog", source: "Postgres", domain: "commerce", ownerName: "Priya Shah", ownerInitials: "PS", updated: "1 hour ago", trust: 82, status: "Healthy" },
  { name: "marketing_attribution", source: "Redshift", domain: "marketing", ownerName: "Diego Alvarez", ownerInitials: "DA", updated: "2 hours ago", trust: 71, status: "Warning" },
  { name: "subscription_churn", source: "Snowflake", domain: "revenue", ownerName: "Emma Larsson", ownerInitials: "EL", updated: "4 hours ago", trust: 68, status: "Warning" },
  { name: "support_tickets", source: "BigQuery", domain: "support", ownerName: "Jordan Reed", ownerInitials: "JR", updated: "6 hours ago", trust: 64, status: "Warning" },
  { name: "inventory_snapshot", source: "Databricks", domain: "ops", ownerName: "Yuki Tanaka", ownerInitials: "YT", updated: "11 hours ago", trust: 52, status: "At Risk" },
  { name: "legacy_invoices", source: "Postgres", domain: "finance", ownerName: "Owen Brooks", ownerInitials: "OB", updated: "2 days ago", trust: 41, status: "At Risk" },
];

function toneClasses(tone: Kpi["tone"]) {
  switch (tone) {
    case "ember": return { bg: "bg-[rgba(255,106,31,0.08)]", text: "text-[#ff6a1f]" };
    case "success": return { bg: "bg-[rgba(52,211,153,0.08)]", text: "text-[#34d399]" };
    case "danger": return { bg: "bg-[rgba(248,113,113,0.08)]", text: "text-[#f87171]" };
    case "warning": return { bg: "bg-[rgba(251,191,36,0.08)]", text: "text-[#fbbf24]" };
  }
}

function trustColor(score: number) {
  if (score >= 85) return { ring: "ring-[#34d399]/40", text: "text-[#34d399]", border: "border-[#34d399]/30" };
  if (score >= 65) return { ring: "ring-[#ff6a1f]/40", text: "text-[#ff6a1f]", border: "border-[#ff6a1f]/30" };
  return { ring: "ring-[#f87171]/40", text: "text-[#f87171]", border: "border-[#f87171]/30" };
}

function statusPill(status: Dataset["status"]) {
  switch (status) {
    case "Healthy":
      return "bg-[rgba(255,106,31,0.12)] text-[#ff8a4a] border border-[rgba(255,106,31,0.25)]";
    case "Warning":
      return "bg-[rgba(251,191,36,0.10)] text-[#fbbf24] border border-[rgba(251,191,36,0.25)]";
    case "At Risk":
      return "bg-[rgba(248,113,113,0.10)] text-[#f87171] border border-[rgba(248,113,113,0.25)]";
  }
}

function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-[#0a0a0c] border-r border-[#16161a] flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-5 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#ff6a1f] flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(255,106,31,0.6)]">
            <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[17px] font-semibold tracking-tight">TrustLayer</span>
        </div>
      </div>

      <div className="px-3 flex-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63]">
          Workspace
        </div>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={[
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors",
                  item.active
                    ? "bg-[#16161a] text-white"
                    : "text-[#8a8a93] hover:text-white hover:bg-[#101014]",
                ].join(" ")}
              >
                <Icon className={["h-[18px] w-[18px]", item.active ? "text-[#ff6a1f]" : ""].join(" ")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* System status */}
      <div className="m-3 rounded-xl border border-[#1f1f24] bg-[#0d0d10] p-3.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6a1f] opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff6a1f]"></span>
          </span>
          <span className="text-[12.5px] font-medium text-white">All systems operational</span>
        </div>
        <div className="mt-1.5 text-[11px] text-[#5a5a63]">Last sync · 2 min ago</div>
      </div>
    </aside>
  );
}

function Header() {
  return (
    <header className="h-16 border-b border-[#16161a] bg-[#08080a]/80 backdrop-blur-xl sticky top-0 z-10">
      <div className="h-full px-8 flex items-center gap-6">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a5a63]" />
            <input
              type="search"
              placeholder="Search datasets, owners, lineage..."
              className="w-full h-10 pl-10 pr-14 rounded-lg bg-[#0d0d10] border border-[#1f1f24] text-[13px] placeholder:text-[#5a5a63] text-white focus:outline-none focus:border-[#2a2a30] transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium text-[#8a8a93] border border-[#2a2a30] bg-[#16161a]">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="relative h-9 w-9 rounded-lg flex items-center justify-center text-[#8a8a93] hover:text-white hover:bg-[#101014] transition-colors">
            <Bell className="h-[17px] w-[17px]" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#ff6a1f]" />
          </button>
          <button className="h-9 w-9 rounded-lg flex items-center justify-center text-[#8a8a93] hover:text-white hover:bg-[#101014] transition-colors">
            <Settings className="h-[17px] w-[17px]" />
          </button>

          <div className="ml-2 flex items-center gap-3 pl-3 pr-3.5 py-1.5 rounded-xl border border-[#1f1f24] bg-[#0d0d10] hover:bg-[#101014] transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#ff6a1f] to-[#c93f00] flex items-center justify-center text-[11px] font-semibold text-white">
              AC
            </div>
            <div className="leading-tight">
              <div className="text-[12.5px] font-semibold text-white">Alex Carter</div>
              <div className="text-[10.5px] text-[#5a5a63]">Acme Corp</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap">
      <div>
        <div className="text-[10.5px] font-semibold tracking-[0.18em] text-[#5a5a63] uppercase">
          Workspace Overview
        </div>
        <h1 className="mt-3 text-[34px] leading-[1.1] font-semibold tracking-tight">
          Good morning, <span className="text-[#ff6a1f]">Alex</span>
        </h1>
        <p className="mt-2 text-[14px] text-[#8a8a93]">
          Here's the trust state of your data across 4 warehouses.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button className="h-10 px-4 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[13px] font-medium text-white flex items-center gap-2 transition-colors">
          <Download className="h-4 w-4" />
          Export report
        </button>
        <button className="h-10 px-4 rounded-lg bg-[#ff6a1f] hover:bg-[#ff7a35] text-[13px] font-semibold text-white flex items-center gap-2 shadow-[0_8px_24px_-8px_rgba(255,106,31,0.7)] transition-colors">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New dataset
        </button>
      </div>
    </div>
  );
}

function KpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const t = toneClasses(kpi.tone);
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className="group relative rounded-2xl border border-[#1f1f24] bg-gradient-to-b from-[#101014] to-[#0b0b0e] p-5 hover:border-[#2a2a30] transition-colors shadow-[0_2px_0_0_rgba(255,255,255,0.02)_inset]"
          >
            <div className="flex items-start justify-between">
              <div className="text-[13px] font-medium text-[#a8a8b3]">{kpi.label}</div>
              <div className={["h-8 w-8 rounded-lg flex items-center justify-center", t.bg].join(" ")}>
                <Icon className={["h-4 w-4", t.text].join(" ")} />
              </div>
            </div>
            <div className="mt-5 text-[34px] font-semibold tracking-tight leading-none">{kpi.value}</div>
            <div className="mt-4 flex items-center gap-1.5 text-[11.5px] text-[#8a8a93]">
              <ArrowUpRight className="h-3 w-3 text-[#5a5a63]" />
              {kpi.delta}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrustRing({ score }: { score: number }) {
  const c = trustColor(score);
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-11 w-11">
      <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" stroke="#1f1f24" strokeWidth="3" fill="none" />
        <circle
          cx="22"
          cy="22"
          r="18"
          stroke="currentColor"
          className={c.text}
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className={["absolute inset-0 flex items-center justify-center text-[11px] font-semibold", c.text].join(" ")}>
        {score}
      </div>
    </div>
  );
}

function DatasetTable() {
  return (
    <div className="rounded-2xl border border-[#1f1f24] bg-gradient-to-b from-[#0d0d10] to-[#0a0a0c] overflow-hidden">
      <div className="px-6 pt-6 pb-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight">Datasets</h2>
          <p className="mt-1 text-[12.5px] text-[#8a8a93]">8 datasets · sorted by trust score</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-3.5 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[12.5px] font-medium text-white flex items-center gap-1.5 transition-colors">
            <Filter className="h-3.5 w-3.5" />
            All sources
          </button>
          <button className="h-9 px-3.5 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[12.5px] font-medium text-white flex items-center gap-1.5 transition-colors">
            <Filter className="h-3.5 w-3.5" />
            All statuses
          </button>
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

        <div>
          {datasets.map((ds) => (
            <div
              key={ds.name}
              className="grid grid-cols-[2fr_1.4fr_1.2fr_0.8fr_1fr] items-center px-6 py-4 border-b border-[#101014] last:border-b-0 hover:bg-[#101014]/60 transition-colors"
            >
              <div>
                <div className="text-[13.5px] font-medium text-white">{ds.name}</div>
                <div className="text-[11.5px] text-[#5a5a63] mt-0.5">
                  {ds.source} · {ds.domain}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-[#1f1f24] flex items-center justify-center text-[10.5px] font-semibold text-[#a8a8b3]">
                  {ds.ownerInitials}
                </div>
                <span className="text-[13px] text-[#d8d8de]">{ds.ownerName}</span>
              </div>
              <div className="text-[12.5px] text-[#8a8a93]">{ds.updated}</div>
              <div>
                <TrustRing score={ds.trust} />
              </div>
              <div>
                <span className={["inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium", statusPill(ds.status)].join(" ")}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {ds.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header />

        <main className="flex-1 px-8 py-8 space-y-7">
          <HeroSection />
          <KpiCards />
          <DatasetTable />
        </main>
      </div>
    </div>
  );
}
