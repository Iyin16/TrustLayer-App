import {
  databases,
  databaseId,
  datasetsCollectionId,
  ID,
  Permission,
  Role,
  Query,
} from "./appwrite";
import type { Models } from "appwrite";
import { statusFor, type Dataset } from "./data";

export type DatasetStatus = "Healthy" | "Warning" | "At Risk";

export type DatasetDoc = Models.Document & {
  name: string;
  owner: string;
  trust_score: number;
  status: DatasetStatus;
  user_id: string;
  source: string;
  last_updated: string;
  description: string;
  issue_reason: string;
};

function ensureConfigured() {
  if (!databaseId || !datasetsCollectionId) {
    throw new Error(
      "Database is not configured. Set NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_DATASETS_COLLECTION_ID, then create the matching database and collection in Appwrite.",
    );
  }
}

export function statusForScore(score: number): DatasetStatus {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Warning";
  return "At Risk";
}

export function clampScore(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeTime(iso: string): { label: string; minutes: number } {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return { label: "Just now", minutes: 0 };
  const now = Date.now();
  const minutes = Math.max(0, Math.round((now - then) / 60000));
  if (minutes < 1) return { label: "Just now", minutes: 0 };
  if (minutes < 60) return { label: `${minutes} minute${minutes === 1 ? "" : "s"} ago`, minutes };
  const hours = Math.round(minutes / 60);
  if (hours < 24) return { label: `${hours} hour${hours === 1 ? "" : "s"} ago`, minutes };
  const days = Math.round(hours / 24);
  return { label: `${days} day${days === 1 ? "" : "s"} ago`, minutes };
}

export function docToDataset(doc: DatasetDoc): Dataset {
  const trust = clampScore(Number(doc.trust_score) || 0);
  const lastUpdatedIso = doc.last_updated || doc.$updatedAt;
  const updated = relativeTime(lastUpdatedIso);
  const passRatio = Math.max(0.2, trust / 100);
  const totalTests = 12;
  const passed = Math.round(totalTests * passRatio);
  const description =
    doc.description?.trim() ||
    `${doc.name} dataset from ${doc.source}, owned by ${doc.owner}.`;
  return {
    name: doc.name,
    source: doc.source,
    domain: "",
    ownerName: doc.owner,
    ownerInitials: initialsFor(doc.owner),
    updated: updated.label,
    updatedMinutes: updated.minutes,
    trust,
    status: statusFor(trust),
    description,
    rows: "—",
    size: "—",
    pillars: {
      freshness: Math.max(10, Math.min(100, trust + 4)),
      ownership: Math.max(20, Math.min(100, trust + 10)),
      schema: Math.max(10, Math.min(100, trust - 2)),
      volume: Math.max(10, Math.min(100, trust - 6)),
    },
    lineage: {
      upstream: Math.max(1, Math.round(trust / 20)),
      downstream: Math.max(1, Math.round(trust / 14)),
      coverage: Math.max(20, Math.min(100, trust + 6)),
    },
    qualityTests: { passed, total: totalTests },
  };
}

export async function listMyDatasets(userId: string): Promise<DatasetDoc[]> {
  ensureConfigured();
  const res = await databases.listDocuments<DatasetDoc>(
    databaseId,
    datasetsCollectionId,
    [Query.equal("user_id", userId), Query.orderDesc("last_updated"), Query.limit(100)],
  );
  return res.documents;
}

export type DatasetInput = {
  name: string;
  owner: string;
  source: string;
  description: string;
  issue_reason: string;
};

const KNOWN_SOURCES = new Set([
  "Snowflake",
  "BigQuery",
  "Postgres",
  "Redshift",
  "Databricks",
]);

const PLACEHOLDER_OWNER = /^(unassigned|n\/?a|tbd|none|unknown|todo|-+)$/i;

/**
 * Authoritative trust-score calculation. Trust score is NEVER user-editable —
 * it is derived from the dataset's metadata quality every time a dataset is
 * created or updated. Status follows directly from the score band.
 */
export function computeLocalTrustScore(input: DatasetInput): {
  score: number;
  status: DatasetStatus;
  reasons: string[];
} {
  let score = 100;
  const reasons: string[] = [];

  const owner = input.owner.trim();
  if (!owner) {
    score -= 25;
    reasons.push("no owner assigned");
  } else if (PLACEHOLDER_OWNER.test(owner)) {
    score -= 20;
    reasons.push(`placeholder owner ("${owner}")`);
  }

  const description = input.description.trim();
  if (!description) {
    score -= 30;
    reasons.push("missing description");
  } else if (description.length < 20) {
    score -= 15;
    reasons.push("very short description (<20 chars)");
  } else if (description.length < 50) {
    score -= 5;
    reasons.push("brief description (<50 chars)");
  }

  if (!input.source.trim()) {
    score -= 15;
    reasons.push("no source specified");
  } else if (!KNOWN_SOURCES.has(input.source)) {
    score -= 10;
    reasons.push(`unverified source ("${input.source}")`);
  }

  if (input.issue_reason.trim()) {
    score -= 15;
    reasons.push("known issue flagged by owner");
  }

  if (input.name.trim().length < 3) {
    score -= 5;
    reasons.push("very short dataset name");
  }

  const clamped = clampScore(score);
  return {
    score: clamped,
    status: statusForScore(clamped),
    reasons,
  };
}

export async function createDataset(
  input: DatasetInput,
  userId: string,
): Promise<DatasetDoc> {
  ensureConfigured();
  const { score, status } = computeLocalTrustScore(input);
  const now = new Date().toISOString();
  const doc = await databases.createDocument<DatasetDoc>(
    databaseId,
    datasetsCollectionId,
    ID.unique(),
    {
      name: input.name,
      owner: input.owner,
      source: input.source,
      trust_score: score,
      status,
      user_id: userId,
      last_updated: now,
      description: input.description,
      issue_reason: input.issue_reason,
    },
    [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ],
  );
  return doc;
}

export async function updateDataset(
  documentId: string,
  existing: DatasetDoc,
  patch: Partial<DatasetInput>,
): Promise<DatasetDoc> {
  ensureConfigured();
  const merged: DatasetInput = {
    name: patch.name ?? existing.name,
    owner: patch.owner ?? existing.owner,
    source: patch.source ?? existing.source,
    description: patch.description ?? existing.description,
    issue_reason: patch.issue_reason ?? existing.issue_reason,
  };
  const { score, status } = computeLocalTrustScore(merged);
  const data: Record<string, unknown> = {
    name: merged.name,
    owner: merged.owner,
    source: merged.source,
    description: merged.description,
    issue_reason: merged.issue_reason,
    trust_score: score,
    status,
    last_updated: new Date().toISOString(),
  };
  return databases.updateDocument<DatasetDoc>(
    databaseId,
    datasetsCollectionId,
    documentId,
    data,
  );
}

export async function deleteDataset(documentId: string): Promise<void> {
  ensureConfigured();
  await databases.deleteDocument(databaseId, datasetsCollectionId, documentId);
}
