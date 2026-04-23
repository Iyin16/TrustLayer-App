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

export type StatusKey = "healthy" | "warning" | "atrisk";

export type DatasetDoc = Models.Document & {
  name: string;
  source: string;
  domain: string;
  ownerName: string;
  ownerId: string;
  trustScore: number;
  status: StatusKey;
};

function ensureConfigured() {
  if (!databaseId || !datasetsCollectionId) {
    throw new Error(
      "Database is not configured. Set NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_DATASETS_COLLECTION_ID, then create the matching database and collection in Appwrite.",
    );
  }
}

function statusKeyFor(score: number): StatusKey {
  if (score >= 80) return "healthy";
  if (score >= 60) return "warning";
  return "atrisk";
}

export function generateTrustScore(): number {
  // Skew slightly toward usable scores so a fresh dataset feels meaningful.
  const base = 35 + Math.floor(Math.random() * 61); // 35..95
  return base;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeTime(iso: string): { label: string; minutes: number } {
  const then = new Date(iso).getTime();
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
  const trust = doc.trustScore;
  const updated = relativeTime(doc.$updatedAt);
  const passRatio = Math.max(0.2, trust / 100);
  const totalTests = 12;
  const passed = Math.round(totalTests * passRatio);
  return {
    name: doc.name,
    source: doc.source,
    domain: doc.domain,
    ownerName: doc.ownerName,
    ownerInitials: initialsFor(doc.ownerName),
    updated: updated.label,
    updatedMinutes: updated.minutes,
    trust,
    status: statusFor(trust),
    description: `${doc.name} dataset from ${doc.source}, owned by ${doc.ownerName}.`,
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
    [Query.equal("ownerId", userId), Query.orderDesc("$updatedAt"), Query.limit(100)],
  );
  return res.documents;
}

export type CreateDatasetInput = {
  name: string;
  source: string;
  domain: string;
  ownerName: string;
  ownerId: string;
};

export async function createDataset(input: CreateDatasetInput): Promise<DatasetDoc> {
  ensureConfigured();
  const trustScore = generateTrustScore();
  const doc = await databases.createDocument<DatasetDoc>(
    databaseId,
    datasetsCollectionId,
    ID.unique(),
    {
      name: input.name,
      source: input.source,
      domain: input.domain,
      ownerName: input.ownerName,
      ownerId: input.ownerId,
      trustScore,
      status: statusKeyFor(trustScore),
    },
    [
      Permission.read(Role.user(input.ownerId)),
      Permission.update(Role.user(input.ownerId)),
      Permission.delete(Role.user(input.ownerId)),
    ],
  );
  return doc;
}

export type UpdateDatasetInput = Partial<{
  name: string;
  ownerName: string;
  source: string;
  domain: string;
  trustScore: number;
}>;

export async function updateDataset(
  documentId: string,
  patch: UpdateDatasetInput,
): Promise<DatasetDoc> {
  ensureConfigured();
  const data: Record<string, unknown> = { ...patch };
  if (typeof patch.trustScore === "number") {
    data.status = statusKeyFor(patch.trustScore);
  }
  return databases.updateDocument<DatasetDoc>(
    databaseId,
    datasetsCollectionId,
    documentId,
    data,
  );
}

export async function regenerateTrustScore(documentId: string): Promise<DatasetDoc> {
  return updateDataset(documentId, { trustScore: generateTrustScore() });
}

export async function deleteDataset(documentId: string): Promise<void> {
  ensureConfigured();
  await databases.deleteDocument(databaseId, datasetsCollectionId, documentId);
}
