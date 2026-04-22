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

export const datasets: Dataset[] = [
  { name: "finance_ledger", source: "Snowflake", domain: "finance", ownerName: "Aisha Rahman", ownerInitials: "AR", updated: "8 minutes ago", trust: 96, status: "Healthy", description: "Authoritative financial ledger — SOX-controlled, audited daily.", rows: "58.4M rows", size: "92 GB", pillars: { freshness: 100, ownership: 100, schema: 92, volume: 90 } },
  { name: "customer_events", source: "BigQuery", domain: "growth", ownerName: "Marcus Chen", ownerInitials: "MC", updated: "32 minutes ago", trust: 89, status: "Healthy", description: "Streamed product events from web, mobile, and server-side SDKs.", rows: "412.8M rows", size: "318 GB", pillars: { freshness: 96, ownership: 100, schema: 84, volume: 78 } },
  { name: "product_catalog", source: "Postgres", domain: "commerce", ownerName: "Priya Shah", ownerInitials: "PS", updated: "1 hour ago", trust: 82, status: "Healthy", description: "Master product catalog replicated from the commerce service.", rows: "1.2M rows", size: "4.4 GB", pillars: { freshness: 88, ownership: 92, schema: 80, volume: 70 } },
  { name: "marketing_attribution", source: "Redshift", domain: "marketing", ownerName: "Diego Alvarez", ownerInitials: "DA", updated: "2 hours ago", trust: 71, status: "Warning", description: "Multi-touch attribution model joining ads, sessions, and revenue.", rows: "8.1M rows", size: "22 GB", pillars: { freshness: 64, ownership: 86, schema: 60, volume: 74 } },
  { name: "subscription_churn", source: "Snowflake", domain: "revenue", ownerName: "Emma Larsson", ownerInitials: "EL", updated: "4 hours ago", trust: 68, status: "Warning", description: "Daily churn snapshot for subscription cohorts and plan tiers.", rows: "640K rows", size: "1.9 GB", pillars: { freshness: 58, ownership: 82, schema: 70, volume: 62 } },
  { name: "support_tickets", source: "BigQuery", domain: "support", ownerName: "Jordan Reed", ownerInitials: "JR", updated: "6 hours ago", trust: 64, status: "Warning", description: "Zendesk tickets enriched with customer and product metadata.", rows: "2.3M rows", size: "8.1 GB", pillars: { freshness: 52, ownership: 80, schema: 64, volume: 60 } },
  { name: "inventory_snapshot", source: "Databricks", domain: "ops", ownerName: "Yuki Tanaka", ownerInitials: "YT", updated: "11 hours ago", trust: 52, status: "At Risk", description: "Daily warehouse snapshot of SKU-level inventory positions.", rows: "18.4M rows", size: "44 GB", pillars: { freshness: 38, ownership: 64, schema: 56, volume: 50 } },
  { name: "legacy_invoices", source: "Postgres", domain: "finance", ownerName: "Owen Brooks", ownerInitials: "OB", updated: "2 days ago", trust: 41, status: "At Risk", description: "Pre-2022 invoice archive — read-only, scheduled for deprecation.", rows: "84K rows", size: "210 MB", pillars: { freshness: 22, ownership: 50, schema: 48, volume: 44 } },
];

export function statusPill(status: Dataset["status"]) {
  switch (status) {
    case "Healthy":
      return "bg-[rgba(255,106,31,0.12)] text-[#ff8a4a] border border-[rgba(255,106,31,0.25)]";
    case "Warning":
      return "bg-[rgba(251,191,36,0.10)] text-[#fbbf24] border border-[rgba(251,191,36,0.25)]";
    case "At Risk":
      return "bg-[rgba(248,113,113,0.10)] text-[#f87171] border border-[rgba(248,113,113,0.25)]";
  }
}
