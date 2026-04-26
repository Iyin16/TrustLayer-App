import { Query } from "./appwrite";
import {
  databases,
  databaseId,
  datasetsCollectionId,
  ID,
  Permission,
  Role,
} from "./appwrite";
import { clampScore, statusForScore, type DatasetDoc } from "./datasets";
import type { OpenMetadataConfig } from "./workspace";

export type OmTable = {
  id: string;
  name: string;
  fullyQualifiedName: string;
  service: string;
  owner: string;
  description: string;
  updatedAt: string | null;
};

export type OmRawOwner = { displayName?: string; name?: string; type?: string };
export type OmRawTable = {
  id?: string;
  name?: string;
  fullyQualifiedName?: string;
  description?: string;
  updatedAt?: number | string;
  owners?: OmRawOwner[];
  owner?: OmRawOwner;
  service?: { name?: string; displayName?: string; fullyQualifiedName?: string };
  serviceType?: string;
};

function normalizeBase(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function ownerLabel(t: OmRawTable): string {
  const candidates: OmRawOwner[] = [];
  if (Array.isArray(t.owners)) candidates.push(...t.owners);
  if (t.owner) candidates.push(t.owner);
  for (const c of candidates) {
    const label = (c.displayName || c.name || "").trim();
    if (label) return label;
  }
  return "";
}

function serviceLabel(t: OmRawTable): string {
  const s = t.service;
  if (!s) return t.serviceType || "OpenMetadata";
  return (s.displayName || s.name || s.fullyQualifiedName || "OpenMetadata").toString();
}

function updatedAtIso(t: OmRawTable): string | null {
  const v = t.updatedAt;
  if (v == null) return null;
  if (typeof v === "number") {
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d.toISOString() : null;
  }
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

export function normalizeTable(raw: OmRawTable): OmTable {
  return {
    id: String(raw.id || raw.fullyQualifiedName || raw.name || ""),
    name: String(raw.name || raw.fullyQualifiedName || "unnamed_table"),
    fullyQualifiedName: String(raw.fullyQualifiedName || raw.name || ""),
    service: serviceLabel(raw),
    owner: ownerLabel(raw),
    description: (raw.description || "").trim(),
    updatedAt: updatedAtIso(raw),
  };
}

/** Trust score model for synced datasets — 100 is best. */
export function computeTrustScore(t: OmTable): number {
  let score = 100;
  if (!t.owner) score -= 25;
  if (!t.description) score -= 15;

  const ts = t.updatedAt ? new Date(t.updatedAt).getTime() : NaN;
  if (!Number.isFinite(ts)) {
    score -= 20;
  } else {
    const days = (Date.now() - ts) / 86_400_000;
    if (days > 30) score -= 30;
    else if (days > 14) score -= 20;
    else if (days > 7) score -= 10;
    else if (days > 3) score -= 5;
  }

  return clampScore(score);
}

export function trustReason(t: OmTable, score: number): string {
  const reasons: string[] = [];
  if (!t.owner) reasons.push("no owner assigned");
  if (!t.description) reasons.push("missing description");
  const ts = t.updatedAt ? new Date(t.updatedAt).getTime() : NaN;
  if (!Number.isFinite(ts)) reasons.push("no last-updated timestamp");
  else {
    const days = Math.round((Date.now() - ts) / 86_400_000);
    if (days > 30) reasons.push(`stale (${days}d since last update)`);
    else if (days > 14) reasons.push(`stale (${days}d since last update)`);
    else if (days > 7) reasons.push(`aging (${days}d since last update)`);
  }
  if (reasons.length === 0) {
    return `Healthy — fresh, owned, documented (score ${score}).`;
  }
  return `Imported from OpenMetadata. Penalties: ${reasons.join(", ")}.`;
}

async function omFetch<T>(
  config: OpenMetadataConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base = normalizeBase(config.url);
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.token}`,
        ...(init?.headers || {}),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    throw new Error(
      `Couldn't reach OpenMetadata at ${base}. ${msg}. ` +
        `If this is a CORS error, allow this origin in your OpenMetadata server's CORS config.`,
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `OpenMetadata API ${res.status} ${res.statusText} — ${body.slice(0, 200) || "no body"}`,
    );
  }
  return (await res.json()) as T;
}

type OmTablesResponse = { data?: OmRawTable[] };

export async function fetchTables(
  config: OpenMetadataConfig,
  opts: { limit?: number } = {},
): Promise<OmTable[]> {
  const limit = opts.limit ?? 50;
  const data = await omFetch<OmTablesResponse>(
    config,
    `/api/v1/tables?fields=owner,owners,description&limit=${limit}`,
  );
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map(normalizeTable);
}

// ---- Optional, prepared for later use --------------------------------------

export type OmLineageEdge = { fromEntity: string; toEntity: string };
export type OmLineage = { upstream: OmLineageEdge[]; downstream: OmLineageEdge[] };

export async function fetchLineage(
  config: OpenMetadataConfig,
  tableId: string,
): Promise<OmLineage> {
  type Resp = {
    upstreamEdges?: OmLineageEdge[];
    downstreamEdges?: OmLineageEdge[];
  };
  const data = await omFetch<Resp>(
    config,
    `/api/v1/lineage/table/${encodeURIComponent(tableId)}?upstreamDepth=1&downstreamDepth=1`,
  );
  return {
    upstream: data.upstreamEdges || [],
    downstream: data.downstreamEdges || [],
  };
}

export type OmTestCase = { name: string; status: string };

export async function fetchTestCases(
  config: OpenMetadataConfig,
  fullyQualifiedName: string,
): Promise<OmTestCase[]> {
  type Resp = { data?: Array<{ name?: string; testCaseResult?: { testCaseStatus?: string } }> };
  const data = await omFetch<Resp>(
    config,
    `/api/v1/dataQuality/testCases?entityLink=${encodeURIComponent(
      `<#E::table::${fullyQualifiedName}>`,
    )}&fields=testCaseResult&limit=50`,
  );
  return (data.data || []).map((r) => ({
    name: String(r.name || ""),
    status: String(r.testCaseResult?.testCaseStatus || "Unknown"),
  }));
}

// ---- Sync ------------------------------------------------------------------

export type SyncResult = {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
};

function ensureConfigured() {
  if (!databaseId || !datasetsCollectionId) {
    throw new Error(
      "Database is not configured. Set NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_DATASETS_COLLECTION_ID first.",
    );
  }
}

async function findExisting(
  userId: string,
  name: string,
): Promise<DatasetDoc | null> {
  const res = await databases.listDocuments<DatasetDoc>(
    databaseId,
    datasetsCollectionId,
    [Query.equal("user_id", userId), Query.equal("name", name), Query.limit(1)],
  );
  return res.documents[0] || null;
}

/**
 * Mocked metadata used as a graceful fallback when the user wants to try
 * the sync pipeline without a real OpenMetadata server (or when the server
 * isn't reachable from the browser due to CORS).
 *
 * 12 assets covering the full trust spectrum — from pristine to critical.
 */
const MOCK_TABLES: OmTable[] = [
  {
    id: "mock-revenue-warehouse",
    name: "revenue_warehouse",
    fullyQualifiedName: "snowflake.analytics.revenue_warehouse",
    service: "Snowflake",
    owner: "Data Engineering",
    description:
      "Consolidated revenue facts joined across orders, payments, refunds, and subscriptions. Primary source for exec-level P&L reporting. Refreshed every 4 hours via dbt.",
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-customer-events",
    name: "customer_events",
    fullyQualifiedName: "bigquery.events.customer_events",
    service: "BigQuery",
    owner: "Growth Analytics",
    description:
      "Streamed customer lifecycle events (signup, activate, churn) from web and mobile SDKs. Schema drift on user_id column detected in last deploy.",
    updatedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-inventory-live-feed",
    name: "inventory_live_feed",
    fullyQualifiedName: "databricks.ops.inventory_live_feed",
    service: "Databricks",
    owner: "Operations",
    description:
      "Real-time SKU-level inventory positions streamed from warehouse RFID sensors at 15-minute intervals. Downstream of inventory_snapshot materialization.",
    updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-supplier-sync-feed",
    name: "supplier_sync_feed",
    fullyQualifiedName: "postgres.procurement.supplier_sync_feed",
    service: "Postgres",
    owner: "Procurement",
    description:
      "Daily feed of supplier prices, lead times, and availability windows synced from third-party EDI integration.",
    updatedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-finance-backup-raw",
    name: "finance_backup_raw",
    fullyQualifiedName: "postgres.finance.finance_backup_raw",
    service: "Postgres",
    owner: "",
    description: "",
    updatedAt: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-user-profiles-master",
    name: "user_profiles_master",
    fullyQualifiedName: "snowflake.identity.user_profiles_master",
    service: "Snowflake",
    owner: "Identity Engineering",
    description:
      "Authoritative user profile master combining CRM, product, and support data. PII fields encrypted at rest. Used for personalization and compliance reporting.",
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-payment-transactions",
    name: "payment_transactions",
    fullyQualifiedName: "snowflake.finance.payment_transactions",
    service: "Snowflake",
    owner: "Finance Engineering",
    description:
      "Immutable ledger of all payment events including charges, refunds, and disputes. Feeds into revenue_warehouse and regulatory reporting. PCI-DSS scoped.",
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-product-catalog",
    name: "product_catalog",
    fullyQualifiedName: "snowflake.commerce.product_catalog",
    service: "Snowflake",
    owner: "Product Data",
    description:
      "Dimensional table of all active and archived SKUs with pricing tiers, category taxonomy, and availability flags. Refreshed nightly from the PIM system.",
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-session-replay-events",
    name: "session_replay_events",
    fullyQualifiedName: "bigquery.analytics.session_replay_events",
    service: "BigQuery",
    owner: "Analytics Platform",
    description:
      "Compressed session replay payload events for heatmap and funnel analysis. Retention capped at 90 days. High volume — partitioned by day.",
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-marketing-attribution",
    name: "marketing_attribution",
    fullyQualifiedName: "redshift.marketing.marketing_attribution",
    service: "Redshift",
    owner: "",
    description: "",
    updatedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-support-tickets-raw",
    name: "support_tickets_raw",
    fullyQualifiedName: "postgres.support.support_tickets_raw",
    service: "Postgres",
    owner: "Support Ops",
    description:
      "Raw ticket payloads from Zendesk webhook. Not cleaned or deduplicated — use support_tickets_clean for analysis.",
    updatedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-campaign-spend-daily",
    name: "campaign_spend_daily",
    fullyQualifiedName: "redshift.marketing.campaign_spend_daily",
    service: "Redshift",
    owner: "Marketing Analytics",
    description:
      "Daily aggregated ad spend by campaign and channel pulled from Google Ads, Meta, and LinkedIn APIs.",
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function syncFromOpenMetadata(
  config: OpenMetadataConfig,
  userId: string,
  opts: { limit?: number; useMock?: boolean } = {},
): Promise<SyncResult> {
  ensureConfigured();
  const tables = opts.useMock
    ? MOCK_TABLES
    : await fetchTables(config, { limit: opts.limit ?? 50 });
  const result: SyncResult = {
    total: tables.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  for (const t of tables) {
    try {
      const score = computeTrustScore(t);
      const status = statusForScore(score);
      const reason = trustReason(t, score);
      const last_updated = t.updatedAt || new Date().toISOString();
      const owner = t.owner || "Unassigned";
      const description =
        t.description || `Imported from OpenMetadata (${t.fullyQualifiedName}).`;

      const existing = await findExisting(userId, t.name);
      if (existing) {
        await databases.updateDocument<DatasetDoc>(
          databaseId,
          datasetsCollectionId,
          existing.$id,
          {
            owner,
            source: t.service,
            trust_score: score,
            status,
            last_updated,
            description,
            issue_reason: reason,
          },
        );
        result.updated += 1;
      } else {
        await databases.createDocument<DatasetDoc>(
          databaseId,
          datasetsCollectionId,
          ID.unique(),
          {
            name: t.name,
            owner,
            source: t.service,
            trust_score: score,
            status,
            user_id: userId,
            last_updated,
            description,
            issue_reason: reason,
          },
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ],
        );
        result.created += 1;
      }
    } catch (err: unknown) {
      result.failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${t.name}: ${msg}`);
    }
  }

  return result;
}

/** Imports the same mocked metadata catalog without requiring a real OpenMetadata server. */
export async function syncMockedMetadata(userId: string): Promise<SyncResult> {
  return syncFromOpenMetadata(
    { url: "mock://sample", token: "mock", connectedAt: new Date().toISOString() },
    userId,
    { useMock: true },
  );
}
