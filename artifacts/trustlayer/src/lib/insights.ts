import type { Dataset } from "./data";

/**
 * Trust Explainer logic — entirely deterministic. Uses ONLY the dataset's
 * own metadata (name, owner, source, trust_score, description, issue_reason).
 * No external knowledge, no model calls, no fabricated context.
 */

export type RiskBand = "high" | "moderate" | "healthy";

export function bandFor(score: number): RiskBand {
  if (score >= 80) return "healthy";
  if (score >= 60) return "moderate";
  return "high";
}

export function bandLabel(band: RiskBand): string {
  return band === "healthy" ? "Healthy" : band === "moderate" ? "Warning" : "At Risk";
}

export type DatasetMeta = {
  name: string;
  owner: string;
  source: string;
  trust_score: number;
  description?: string;
  issue_reason?: string;
};

export function toMeta(d: Dataset): DatasetMeta {
  return {
    name: d.name,
    owner: d.ownerName,
    source: d.source,
    trust_score: d.trust,
    description: d.description,
  };
}

const KNOWN_SOURCES = new Set([
  "Snowflake",
  "BigQuery",
  "Postgres",
  "Redshift",
  "Databricks",
]);

const PLACEHOLDER_OWNER = /^(unassigned|n\/?a|tbd|none|unknown|todo|-+)$/i;

type Issue = {
  code:
    | "missing_owner"
    | "placeholder_owner"
    | "missing_description"
    | "thin_description"
    | "unknown_source"
    | "missing_source"
    | "flagged_issue"
    | "low_trust";
  label: string;
};

export function detectIssues(d: DatasetMeta): Issue[] {
  const issues: Issue[] = [];
  const owner = (d.owner || "").trim();
  if (!owner) {
    issues.push({ code: "missing_owner", label: "No owner assigned" });
  } else if (PLACEHOLDER_OWNER.test(owner)) {
    issues.push({
      code: "placeholder_owner",
      label: `Placeholder owner ("${owner}")`,
    });
  }
  const desc = (d.description || "").trim();
  if (!desc) {
    issues.push({ code: "missing_description", label: "Missing description" });
  } else if (desc.length < 30) {
    issues.push({ code: "thin_description", label: "Very short description" });
  }
  const src = (d.source || "").trim();
  if (!src) {
    issues.push({ code: "missing_source", label: "No source specified" });
  } else if (!KNOWN_SOURCES.has(src)) {
    issues.push({
      code: "unknown_source",
      label: `Unverified source ("${src}")`,
    });
  }
  if ((d.issue_reason || "").trim()) {
    issues.push({ code: "flagged_issue", label: "Owner flagged a known issue" });
  }
  if (d.trust_score < 60) {
    issues.push({ code: "low_trust", label: "Trust score below 60" });
  }
  return issues;
}

/**
 * Returns a short, executive-friendly risk explanation for a single dataset.
 * The explanation is grounded only in the dataset's own metadata.
 */
export function explainRisk(d: DatasetMeta): {
  band: RiskBand;
  headline: string;
  body: string;
} {
  const band = bandFor(d.trust_score);
  const issues = detectIssues(d);
  const ownerStr = d.owner?.trim()
    ? `owned by ${d.owner}`
    : "with no assigned owner";
  const sourceStr = d.source?.trim() ? ` from ${d.source}` : "";

  if (band === "high") {
    const reasonStr =
      issues.length > 0
        ? issues
            .filter((i) => i.code !== "low_trust")
            .map((i) => i.label.toLowerCase())
            .join(", ") || "multiple metadata gaps"
        : "multiple metadata gaps";
    return {
      band,
      headline: `${d.name} is high risk (${d.trust_score}/100)`,
      body: `${d.name}${sourceStr} is ${ownerStr}. The score is below 60 because of ${reasonStr}. Treat this dataset as untrusted for reporting until the gaps above are resolved.`,
    };
  }

  if (band === "moderate") {
    const reasonStr =
      issues.length > 0
        ? issues.map((i) => i.label.toLowerCase()).join(", ")
        : "minor documentation or ownership gaps";
    return {
      band,
      headline: `${d.name} needs attention (${d.trust_score}/100)`,
      body: `${d.name}${sourceStr} is ${ownerStr}. It scores in the warning band due to ${reasonStr}. It's still usable but resolving these will lift it back to healthy.`,
    };
  }

  const ownerNote = d.owner?.trim() ? ` Maintained by ${d.owner}.` : "";
  return {
    band,
    headline: `${d.name} is healthy (${d.trust_score}/100)`,
    body: `${d.name}${sourceStr} has a complete metadata record and no flagged issues.${ownerNote} Safe to use for reporting and downstream models.`,
  };
}

/** Top N riskiest datasets (lowest trust score first, then by missing owners). */
export function topRiskyDatasets(
  list: DatasetMeta[],
  n = 3,
): DatasetMeta[] {
  return [...list]
    .sort((a, b) => {
      if (a.trust_score !== b.trust_score) return a.trust_score - b.trust_score;
      const aOwner = a.owner?.trim() ? 1 : 0;
      const bOwner = b.owner?.trim() ? 1 : 0;
      return aOwner - bOwner;
    })
    .slice(0, n);
}

/** Plain-language summary of system health across all datasets. */
export function systemHealthSummary(list: DatasetMeta[]): {
  total: number;
  healthy: number;
  warning: number;
  atRisk: number;
  avg: number;
  oneLiner: string;
} {
  const total = list.length;
  if (total === 0) {
    return {
      total: 0,
      healthy: 0,
      warning: 0,
      atRisk: 0,
      avg: 0,
      oneLiner: "No datasets registered yet — add one to start tracking trust.",
    };
  }
  let healthy = 0;
  let warning = 0;
  let atRisk = 0;
  let sum = 0;
  for (const d of list) {
    sum += d.trust_score;
    const b = bandFor(d.trust_score);
    if (b === "healthy") healthy += 1;
    else if (b === "moderate") warning += 1;
    else atRisk += 1;
  }
  const avg = Math.round(sum / total);
  let oneLiner: string;
  if (atRisk > 0) {
    oneLiner = `${atRisk} of ${total} dataset${total === 1 ? "" : "s"} are at risk and need owner attention. Average trust ${avg}/100.`;
  } else if (warning > 0) {
    oneLiner = `${warning} of ${total} dataset${total === 1 ? "" : "s"} are in the warning band. Average trust ${avg}/100.`;
  } else {
    oneLiner = `All ${total} dataset${total === 1 ? "" : "s"} are healthy. Average trust ${avg}/100.`;
  }
  return { total, healthy, warning, atRisk, avg, oneLiner };
}

/**
 * Simple, deterministic remediation suggestions derived only from
 * the metadata fields present on the dataset.
 */
export function fixSuggestions(d: DatasetMeta): string[] {
  const issues = detectIssues(d);
  const tips: string[] = [];
  for (const issue of issues) {
    switch (issue.code) {
      case "missing_owner":
        tips.push(
          `Assign an owner to ${d.name} so changes have a clear point of contact.`,
        );
        break;
      case "placeholder_owner":
        tips.push(
          `Replace the placeholder owner on ${d.name} with a real person or team.`,
        );
        break;
      case "missing_description":
        tips.push(
          `Add a description that explains what ${d.name} contains and how it's used.`,
        );
        break;
      case "thin_description":
        tips.push(
          `Expand the description on ${d.name} — include source system, refresh cadence, and key columns.`,
        );
        break;
      case "missing_source":
        tips.push(
          `Set the source warehouse for ${d.name} so consumers know where it lives.`,
        );
        break;
      case "unknown_source":
        tips.push(
          `Confirm the source "${d.source}" for ${d.name} is one of your supported warehouses.`,
        );
        break;
      case "flagged_issue":
        tips.push(
          `Resolve the open issue flagged on ${d.name} and clear the issue note.`,
        );
        break;
      case "low_trust":
        // covered by other tips; only add if no other actionable tips were produced
        break;
    }
  }
  if (tips.length === 0) {
    if (d.trust_score >= 80) {
      tips.push(
        `${d.name} looks healthy — no remediation needed. Keep its description and owner up to date as the schema evolves.`,
      );
    } else {
      tips.push(
        `Review the metadata fields on ${d.name} and re-save the record so the trust score recalculates.`,
      );
    }
  }
  return tips;
}
