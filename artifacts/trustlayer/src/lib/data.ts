export type Dataset = {
  name: string;
  source: string;
  domain: string;
  ownerName: string;
  ownerInitials: string;
  updated: string;
  trust: number;
  status: "Healthy" | "Warning" | "At Risk";
};

export const datasets: Dataset[] = [
  { name: "finance_ledger", source: "Snowflake", domain: "finance", ownerName: "Aisha Rahman", ownerInitials: "AR", updated: "8 minutes ago", trust: 96, status: "Healthy" },
  { name: "customer_events", source: "BigQuery", domain: "growth", ownerName: "Marcus Chen", ownerInitials: "MC", updated: "32 minutes ago", trust: 89, status: "Healthy" },
  { name: "product_catalog", source: "Postgres", domain: "commerce", ownerName: "Priya Shah", ownerInitials: "PS", updated: "1 hour ago", trust: 82, status: "Healthy" },
  { name: "marketing_attribution", source: "Redshift", domain: "marketing", ownerName: "Diego Alvarez", ownerInitials: "DA", updated: "2 hours ago", trust: 71, status: "Warning" },
  { name: "subscription_churn", source: "Snowflake", domain: "revenue", ownerName: "Emma Larsson", ownerInitials: "EL", updated: "4 hours ago", trust: 68, status: "Warning" },
  { name: "support_tickets", source: "BigQuery", domain: "support", ownerName: "Jordan Reed", ownerInitials: "JR", updated: "6 hours ago", trust: 64, status: "Warning" },
  { name: "inventory_snapshot", source: "Databricks", domain: "ops", ownerName: "Yuki Tanaka", ownerInitials: "YT", updated: "11 hours ago", trust: 52, status: "At Risk" },
  { name: "legacy_invoices", source: "Postgres", domain: "finance", ownerName: "Owen Brooks", ownerInitials: "OB", updated: "2 days ago", trust: 41, status: "At Risk" },
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
