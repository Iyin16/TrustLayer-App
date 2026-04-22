export type Dataset = {
  name: string;
  source: string;
  domain: string;
  ownerName: string;
  ownerInitials: string;
  updated: string;
  trust: number;
  status: "Healthy" | "Warning" | "At Risk";
  description: string;
  rows: string;
  size: string;
  pillars: { freshness: number; ownership: number; schema: number; volume: number };
};

export function statusFor(trust: number): Dataset["status"] {
  if (trust >= 80) return "Healthy";
  if (trust >= 60) return "Warning";
  return "At Risk";
}

const seed: Omit<Dataset, "status">[] = [
  { name: "finance_ledger", source: "Snowflake", domain: "finance", ownerName: "Aisha Rahman", ownerInitials: "AR", updated: "8 minutes ago", trust: 96, description: "Authoritative financial ledger — SOX-controlled, audited daily.", rows: "58.4M rows", size: "92 GB", pillars: { freshness: 100, ownership: 100, schema: 92, volume: 90 } },
  { name: "customer_events", source: "BigQuery", domain: "growth", ownerName: "Marcus Chen", ownerInitials: "MC", updated: "32 minutes ago", trust: 84, description: "Streamed product events from web, mobile, and server-side SDKs.", rows: "412.8M rows", size: "318 GB", pillars: { freshness: 92, ownership: 96, schema: 80, volume: 78 } },
  { name: "product_catalog", source: "Postgres", domain: "commerce", ownerName: "Priya Shah", ownerInitials: "PS", updated: "1 hour ago", trust: 74, description: "Master product catalog replicated from the commerce service.", rows: "1.2M rows", size: "4.4 GB", pillars: { freshness: 78, ownership: 88, schema: 70, volume: 64 } },
  { name: "marketing_attribution", source: "Redshift", domain: "marketing", ownerName: "Diego Alvarez", ownerInitials: "DA", updated: "2 hours ago", trust: 67, description: "Multi-touch attribution model joining ads, sessions, and revenue.", rows: "8.1M rows", size: "22 GB", pillars: { freshness: 62, ownership: 84, schema: 60, volume: 64 } },
  { name: "subscription_churn", source: "Snowflake", domain: "revenue", ownerName: "Emma Larsson", ownerInitials: "EL", updated: "4 hours ago", trust: 58, description: "Daily churn snapshot for subscription cohorts and plan tiers.", rows: "640K rows", size: "1.9 GB", pillars: { freshness: 48, ownership: 72, schema: 58, volume: 56 } },
  { name: "support_tickets", source: "BigQuery", domain: "support", ownerName: "Jordan Reed", ownerInitials: "JR", updated: "6 hours ago", trust: 43, description: "Zendesk tickets enriched with customer and product metadata.", rows: "2.3M rows", size: "8.1 GB", pillars: { freshness: 32, ownership: 60, schema: 44, volume: 38 } },
  { name: "inventory_snapshot", source: "Databricks", domain: "ops", ownerName: "Yuki Tanaka", ownerInitials: "YT", updated: "11 hours ago", trust: 21, description: "Daily warehouse snapshot of SKU-level inventory positions.", rows: "18.4M rows", size: "44 GB", pillars: { freshness: 14, ownership: 36, schema: 22, volume: 18 } },
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
