export type Dataset = {
  name: string;
  source: string;
  domain: string;
  ownerName: string;
  ownerInitials: string;
  updated: string;
  updatedMinutes: number;
  trust: number;
  status: "Healthy" | "Warning" | "At Risk";
  description: string;
  rows: string;
  size: string;
  pillars: { freshness: number; ownership: number; schema: number; volume: number };
  lineage: { upstream: number; downstream: number; coverage: number };
  qualityTests: { passed: number; total: number };
};

export const DEMO_WORKSPACE_NAME = "NovaMart Commerce";
export const DEMO_WORKSPACE_INDUSTRY = "Ecommerce / Retail";
export const DEMO_WORKSPACE_TAGLINE =
  "Multi-channel commerce stack — Shopify Plus, Stripe, Segment, and a fulfillment network across 14 DCs.";

export function statusFor(trust: number): Dataset["status"] {
  if (trust >= 80) return "Healthy";
  if (trust >= 60) return "Warning";
  return "At Risk";
}

const seed: Omit<Dataset, "status">[] = [
  {
    name: "revenue_warehouse",
    source: "Snowflake",
    domain: "finance",
    ownerName: "Priya Shah",
    ownerInitials: "PS",
    updated: "4 minutes ago",
    updatedMinutes: 4,
    trust: 94,
    description:
      "Authoritative revenue model — orders × payments × refunds across web, app, and in-store POS. Powers the exec dashboard and the monthly finance close.",
    rows: "142.6M rows",
    size: "412 GB",
    pillars: { freshness: 100, ownership: 100, schema: 92, volume: 94 },
    lineage: { upstream: 2, downstream: 8, coverage: 96 },
    qualityTests: { passed: 28, total: 28 },
  },
  {
    name: "customer_events",
    source: "BigQuery",
    domain: "growth",
    ownerName: "Marcus Chen",
    ownerInitials: "MC",
    updated: "18 minutes ago",
    updatedMinutes: 18,
    trust: 76,
    description:
      "Unified product event stream from web, mobile, and server-side SDKs. Schema drift detected on the cart_v3 event since the last release.",
    rows: "968.4M rows",
    size: "1.2 TB",
    pillars: { freshness: 88, ownership: 90, schema: 70, volume: 64 },
    lineage: { upstream: 1, downstream: 14, coverage: 82 },
    qualityTests: { passed: 19, total: 22 },
  },
  {
    name: "inventory_live_feed",
    source: "Databricks",
    domain: "ops",
    ownerName: "Yuki Tanaka",
    ownerInitials: "YT",
    updated: "90 seconds ago",
    updatedMinutes: 1,
    trust: 88,
    description:
      "Real-time SKU-level stock positions streamed from fulfillment-center IoT scanners and Shopify locations.",
    rows: "24.8M rows",
    size: "86 GB",
    pillars: { freshness: 96, ownership: 92, schema: 86, volume: 84 },
    lineage: { upstream: 2, downstream: 7, coverage: 90 },
    qualityTests: { passed: 17, total: 19 },
  },
  {
    name: "finance_backup_raw",
    source: "Postgres",
    domain: "finance",
    ownerName: "Owen Brooks",
    ownerInitials: "OB",
    updated: "3 days ago",
    updatedMinutes: 4320,
    trust: 43,
    description:
      "Legacy Oracle ERP nightly dump retained for audit. Owner has been offboarded and the pipeline hasn't refreshed since Tuesday.",
    rows: "6.4M rows",
    size: "18 GB",
    pillars: { freshness: 24, ownership: 38, schema: 50, volume: 60 },
    lineage: { upstream: 1, downstream: 2, coverage: 38 },
    qualityTests: { passed: 4, total: 16 },
  },
  {
    name: "ad_spend_reporting",
    source: "Redshift",
    domain: "marketing",
    ownerName: "Diego Alvarez",
    ownerInitials: "DA",
    updated: "3 hours ago",
    updatedMinutes: 180,
    trust: 67,
    description:
      "Daily roll-up of paid-media spend across Google, Meta, and TikTok. The Meta Ads connector has been intermittently failing for 36 hours.",
    rows: "4.2M rows",
    size: "12 GB",
    pillars: { freshness: 70, ownership: 80, schema: 60, volume: 64 },
    lineage: { upstream: 2, downstream: 5, coverage: 64 },
    qualityTests: { passed: 11, total: 17 },
  },
  {
    name: "returns_dashboard_source",
    source: "Snowflake",
    domain: "customer",
    ownerName: "Aisha Rahman",
    ownerInitials: "AR",
    updated: "25 minutes ago",
    updatedMinutes: 25,
    trust: 82,
    description:
      "Returns and RMA events joined with order, customer, and reason-code dimensions. Powers the CX returns dashboard and weekly merchandising review.",
    rows: "11.7M rows",
    size: "38 GB",
    pillars: { freshness: 84, ownership: 90, schema: 80, volume: 78 },
    lineage: { upstream: 2, downstream: 6, coverage: 84 },
    qualityTests: { passed: 18, total: 20 },
  },
  {
    name: "supplier_sync_feed",
    source: "Postgres",
    domain: "supply chain",
    ownerName: "Jordan Reed",
    ownerInitials: "JR",
    updated: "14 hours ago",
    updatedMinutes: 840,
    trust: 58,
    description:
      "Inbound supplier ASN and PO acknowledgements via EDI. Two upstream supplier endpoints have been timing out for 12+ hours.",
    rows: "820K rows",
    size: "2.6 GB",
    pillars: { freshness: 36, ownership: 64, schema: 60, volume: 64 },
    lineage: { upstream: 1, downstream: 3, coverage: 52 },
    qualityTests: { passed: 6, total: 14 },
  },
  {
    name: "user_profiles_master",
    source: "Snowflake",
    domain: "customer",
    ownerName: "Emma Larsson",
    ownerInitials: "EL",
    updated: "12 minutes ago",
    updatedMinutes: 12,
    trust: 91,
    description:
      "Master CRM profile per customer — identity stitched from Shopify, Segment, and support tickets. Source of truth for lifecycle messaging.",
    rows: "38.2M rows",
    size: "124 GB",
    pillars: { freshness: 94, ownership: 100, schema: 88, volume: 86 },
    lineage: { upstream: 2, downstream: 11, coverage: 92 },
    qualityTests: { passed: 24, total: 26 },
  },
];

export const datasets: Dataset[] = seed.map((d) => ({ ...d, status: statusFor(d.trust) }));

export const trustCounts = {
  healthy: datasets.filter((d) => d.status === "Healthy").length,
  warning: datasets.filter((d) => d.status === "Warning").length,
  atRisk: datasets.filter((d) => d.status === "At Risk").length,
  avg: Math.round(datasets.reduce((a, d) => a + d.trust, 0) / datasets.length),
};

export function statusPill(status: Dataset["status"]) {
  switch (status) {
    case "Healthy":
      return "bg-[rgba(52,211,153,0.10)] text-[#34d399] border border-[rgba(52,211,153,0.28)]";
    case "Warning":
      return "bg-[rgba(251,191,36,0.10)] text-[#fbbf24] border border-[rgba(251,191,36,0.28)]";
    case "At Risk":
      return "bg-[rgba(248,113,113,0.10)] text-[#f87171] border border-[rgba(248,113,113,0.28)]";
  }
}

export function trustExplanation(trust: number) {
  if (trust >= 80) return "Reliable — safe for reporting and decision-making.";
  if (trust >= 60) return "Usable, but needs attention. Minor freshness, ownership, or quality issues.";
  return "Review before use. Significant metadata, freshness, lineage, or quality concerns.";
}
