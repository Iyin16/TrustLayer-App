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
 */
const MOCK_TABLES: OmTable[] = [
  {
    id: "mock-orders",
    name: "orders",
    fullyQualifiedName: "warehouse.public.orders",
    service: "Snowflake",
    owner: "Data Platform",
    description:
      "Customer order facts at line-item grain, joined with payments and shipping. Powers daily revenue reporting.",
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-customers",
    name: "customers",
    fullyQualifiedName: "warehouse.public.customers",
    service: "Snowflake",
    owner: "CRM Team",
    description:
      "Master customer profile per identity, stitched from web, app, and support sources.",
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-events",
    name: "product_events",
    fullyQualifiedName: "analytics.events.product_events",
    service: "BigQuery",
    owner: "Growth Analytics",
    description:
      "Streamed product events from web and mobile SDKs at session grain.",
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-marketing",
    name: "ad_spend_daily",
    fullyQualifiedName: "marketing.reporting.ad_spend_daily",
    service: "Redshift",
    owner: "",
    description: "",
    updatedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-inventory",
    name: "inventory_snapshot",
    fullyQualifiedName: "ops.warehouse.inventory_snapshot",
    service: "Databricks",
    owner: "Operations",
    description: "SKU-level stock positions snapshot taken every 15 minutes.",
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-finance",
    name: "ledger_nightly",
    fullyQualifiedName: "finance.archive.ledger_nightly",
    service: "Postgres",
    owner: "Unassigned",
    description: "Nightly finance ledger backup retained for audit.",
    updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
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
