import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Lightbulb,
  Loader2,
  BarChart3,
  Shield,
  Printer,
} from "lucide-react";
import { PageHeader, Card } from "../components/Layout";
import { TrustRing } from "../components/TrustRing";
import { useAuth } from "../lib/auth";
import { useWorkspace } from "../lib/workspace";
import {
  datasets as demoDatasets,
  DEMO_WORKSPACE_NAME,
  statusPill,
  type Dataset,
} from "../lib/data";
import { docToDataset, listMyDatasets } from "../lib/datasets";
import { systemHealthSummary, topRiskyDatasets, fixSuggestions, toMeta } from "../lib/insights";

function fmtDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function escCsv(v: string | number): string {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(datasets: Dataset[], workspaceName: string) {
  const rows: string[][] = [
    ["TrustLayer — Data Trust Report", "", "", "", "", ""],
    [`Workspace: ${workspaceName}`, "", "", "", "", ""],
    [`Generated: ${fmtDate()}`, "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["Dataset", "Source", "Owner", "Trust Score", "Status", "Last Updated"],
    ...datasets.map((d) => [
      d.name,
      d.source,
      d.ownerName,
      String(d.trust),
      d.status,
      d.updated,
    ]),
  ];
  const csv = rows.map((r) => r.map(escCsv).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trustlayer-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function generatePdfHtml(datasets: Dataset[], workspaceName: string): string {
  const healthy = datasets.filter((d) => d.status === "Healthy").length;
  const warning = datasets.filter((d) => d.status === "Warning").length;
  const atRisk = datasets.filter((d) => d.status === "At Risk").length;
  const avg =
    datasets.length === 0
      ? 0
      : Math.round(datasets.reduce((a, d) => a + d.trust, 0) / datasets.length);

  const metas = datasets.map(toMeta);
  const risky = topRiskyDatasets(metas, 5);

  const allRecs: string[] = [];
  for (const m of risky.slice(0, 3)) {
    const tips = fixSuggestions(m);
    for (const t of tips.slice(0, 2)) allRecs.push(t);
  }
  const uniqueRecs = [...new Set(allRecs)].slice(0, 6);

  const scoreColor = (s: number) =>
    s >= 80 ? "#16a34a" : s >= 60 ? "#b45309" : "#dc2626";
  const statusColor = (s: Dataset["status"]) =>
    s === "Healthy" ? "#16a34a" : s === "Warning" ? "#b45309" : "#dc2626";

  const tableRows = datasets
    .map(
      (d) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:500">${d.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${d.source}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${d.ownerName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;color:${scoreColor(d.trust)}">${d.trust}/100</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">
        <span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600;background:${d.status === "Healthy" ? "#dcfce7" : d.status === "Warning" ? "#fef3c7" : "#fee2e2"};color:${statusColor(d.status)}">${d.status}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${d.updated}</td>
    </tr>`,
    )
    .join("");

  const riskyRows = risky
    .map(
      (m) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">${m.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${m.source}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${m.owner || "Unassigned"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;color:${scoreColor(m.trust_score)}">${m.trust_score}/100</td>
    </tr>`,
    )
    .join("");

  const recItems = uniqueRecs
    .map((r) => `<li style="margin-bottom:6px;line-height:1.5">${r}</li>`)
    .join("");

  const execSummary =
    atRisk > 0
      ? `${atRisk} dataset${atRisk === 1 ? "" : "s"} require urgent attention before use in reporting. ${warning} additional dataset${warning === 1 ? "" : "s"} are in a warning state. Average trust score is ${avg}/100 across ${datasets.length} registered datasets.`
      : warning > 0
        ? `${warning} dataset${warning === 1 ? "" : "s"} are in a warning band and should be reviewed. All ${healthy} remaining datasets are healthy. Average trust score is ${avg}/100.`
        : `All ${datasets.length} datasets are healthy with complete ownership and documentation. Average trust score is ${avg}/100 — no critical issues detected.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>TrustLayer Trust Report — ${workspaceName}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#111827;background:#fff;padding:40px}
  @media print{body{padding:20px}@page{margin:20mm}}
  h1{font-size:26px;font-weight:700;letter-spacing:-0.02em;color:#111827}
  h2{font-size:15px;font-weight:700;margin-bottom:12px;color:#111827;border-bottom:2px solid #ea580c;padding-bottom:6px;display:inline-block}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  thead th{background:#f9fafb;padding:9px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;border-bottom:2px solid #e5e7eb}
  .section{margin-bottom:32px}
  .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;margin-right:8px}
  .brand{display:flex;align-items:center;gap:12px;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid #e5e7eb}
  .logo{width:40px;height:40px;background:#ea580c;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:700}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px}
  .stat-box{border:1px solid #e5e7eb;border-radius:10px;padding:16px;text-align:center}
  .stat-num{font-size:28px;font-weight:700;line-height:1;margin-bottom:4px}
  .stat-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7280}
  .exec-box{background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px;margin-bottom:32px}
  .exec-box p{color:#7c2d12;line-height:1.6;font-size:13.5px}
  .rec-list{padding-left:20px}
  .rec-list li{color:#374151;line-height:1.6;font-size:12.5px}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;display:flex;justify-content:space-between}
</style>
</head>
<body>
<div class="brand">
  <div class="logo">T</div>
  <div>
    <div style="font-size:20px;font-weight:700;color:#111827">TrustLayer</div>
    <div style="font-size:12px;color:#6b7280">Data Trust Intelligence Platform</div>
  </div>
  <div style="margin-left:auto;text-align:right">
    <div style="font-size:13px;font-weight:600">${workspaceName}</div>
    <div style="font-size:11px;color:#6b7280">Report generated ${fmtDate()}</div>
  </div>
</div>

<h1 style="margin-bottom:6px">Data Trust Report</h1>
<p style="color:#6b7280;margin-bottom:28px;font-size:13px">Transforming OpenMetadata into actionable trust intelligence.</p>

<div class="section">
  <h2>Executive Summary</h2>
  <div class="exec-box">
    <p>${execSummary}</p>
  </div>
</div>

<div class="stats-grid">
  <div class="stat-box">
    <div class="stat-num" style="color:#111827">${datasets.length}</div>
    <div class="stat-label">Total Datasets</div>
  </div>
  <div class="stat-box">
    <div class="stat-num" style="color:#16a34a">${healthy}</div>
    <div class="stat-label">Healthy</div>
  </div>
  <div class="stat-box">
    <div class="stat-num" style="color:#b45309">${warning}</div>
    <div class="stat-label">Warning</div>
  </div>
  <div class="stat-box">
    <div class="stat-num" style="color:#dc2626">${atRisk}</div>
    <div class="stat-label">At Risk</div>
  </div>
</div>

${risky.length > 0 ? `
<div class="section">
  <h2>Top Risky Datasets</h2>
  <table>
    <thead><tr>
      <th>Dataset</th><th>Source</th><th>Owner</th><th style="text-align:center">Trust Score</th>
    </tr></thead>
    <tbody>${riskyRows}</tbody>
  </table>
</div>` : ""}

<div class="section">
  <h2>Full Dataset Catalog</h2>
  <table>
    <thead><tr>
      <th>Dataset</th><th>Source</th><th>Owner</th><th style="text-align:center">Trust Score</th><th style="text-align:center">Status</th><th>Last Updated</th>
    </tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
</div>

${uniqueRecs.length > 0 ? `
<div class="section">
  <h2>Recommendations</h2>
  <ul class="rec-list">${recItems}</ul>
</div>` : ""}

<div class="footer">
  <span>TrustLayer · Data Trust Intelligence · ${workspaceName}</span>
  <span>Generated ${fmtDate()} · Confidential</span>
</div>
<script>window.onload=()=>{window.print();}</script>
</body>
</html>`;
}

function openPdf(datasets: Dataset[], workspaceName: string) {
  const html = generatePdfHtml(datasets, workspaceName);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

export default function Reports() {
  const { user } = useAuth();
  const { mode } = useWorkspace();
  const isDemo = mode === "demo";
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(!isDemo);
  const workspaceName = isDemo ? DEMO_WORKSPACE_NAME : user?.name || "My Workspace";

  useEffect(() => {
    let cancelled = false;
    if (isDemo) {
      setDatasets([...demoDatasets].sort((a, b) => b.trust - a.trust));
      setLoading(false);
      return;
    }
    if (!user) return;
    setLoading(true);
    listMyDatasets(user.$id)
      .then((docs) => {
        if (!cancelled) {
          setDatasets(docs.map(docToDataset).sort((a, b) => b.trust - a.trust));
        }
      })
      .catch(() => { if (!cancelled) setDatasets([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isDemo, user]);

  const metas = useMemo(() => datasets.map(toMeta), [datasets]);
  const summary = useMemo(() => systemHealthSummary(metas), [metas]);
  const risky = useMemo(() => topRiskyDatasets(metas, 5), [metas]);
  const recommendations = useMemo(() => {
    const all: string[] = [];
    for (const m of risky.slice(0, 3)) {
      for (const t of fixSuggestions(m).slice(0, 2)) all.push(t);
    }
    return [...new Set(all)].slice(0, 6);
  }, [risky]);

  const reportDate = fmtDate();

  const scoreColor = (s: number) =>
    s >= 80
      ? "text-[#34d399] bg-[rgba(52,211,153,0.10)] border-[rgba(52,211,153,0.28)]"
      : s >= 60
        ? "text-[#fbbf24] bg-[rgba(251,191,36,0.10)] border-[rgba(251,191,36,0.28)]"
        : "text-[#f87171] bg-[rgba(248,113,113,0.10)] border-[rgba(248,113,113,0.28)]";

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Trust"
        highlight="Report"
        description="Generate, preview, and export executive trust reports — suitable for sharing with leadership and stakeholders."
        actions={
          datasets.length > 0 ? (
            <>
              <button
                onClick={() => downloadCsv(datasets, workspaceName)}
                className="h-10 px-4 rounded-lg border border-[#2a2a30] bg-[#0d0d10]/80 hover:bg-[#16161a] hover:border-[#3a3a40] text-[13px] font-medium text-white flex items-center gap-2 transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
              >
                <FileSpreadsheet className="h-4 w-4 text-[#34d399]" />
                Export CSV
              </button>
              <div className="relative">
                <span className="pointer-events-none absolute -inset-3 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(255,106,31,0.45),transparent_65%)] blur-xl" />
                <button
                  onClick={() => openPdf(datasets, workspaceName)}
                  className="relative h-10 px-4 rounded-lg bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] hover:from-[#ff7a59] hover:to-[#ff4d2e] text-[13px] font-semibold text-white flex items-center gap-2 transition-all shadow-[0_10px_30px_-6px_rgba(255,106,31,0.55),0_0_0_1px_rgba(255,138,74,0.4)_inset,0_1px_0_0_rgba(255,255,255,0.25)_inset]"
                >
                  <Printer className="h-4 w-4" strokeWidth={2.75} />
                  Export PDF
                </button>
              </div>
            </>
          ) : undefined
        }
      />

      {loading ? (
        <Card className="p-10 flex items-center justify-center gap-3 text-[13px] text-[#a1a1aa]">
          <Loader2 className="h-4 w-4 animate-spin text-[#ff7a59]" />
          Loading datasets…
        </Card>
      ) : datasets.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] flex items-center justify-center shadow-[0_12px_30px_-8px_rgba(255,106,31,0.6)]">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-5 text-[18px] font-semibold tracking-tight text-white">No data to report yet</h2>
          <p className="mt-1.5 text-[13px] text-[#9a9aa3] max-w-sm mx-auto">
            Register datasets from the dashboard and they'll appear here ready to export.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">

          {/* Report Preview Card */}
          <Card className="overflow-hidden">
            {/* Report Header */}
            <div className="relative px-8 pt-8 pb-7 border-b border-[#16161a] bg-gradient-to-b from-[#0f0f13] to-[#0a0a0d]">
              <span className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,77,46,0.12),transparent_65%)] blur-3xl" />
              <div className="relative flex items-start justify-between gap-6 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#ff4d2e] to-[#a8260f] flex items-center justify-center shadow-[0_0_24px_rgba(255,77,46,0.35)]">
                      <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="text-[18px] font-bold tracking-tight text-white">TrustLayer</div>
                      <div className="text-[11px] text-[#5a5a63]">Data Trust Intelligence Platform</div>
                    </div>
                  </div>
                  <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-white">
                    Data Trust Report
                  </h2>
                  <p className="mt-1 text-[13px] text-[#6a6a73]">
                    Transforming OpenMetadata into actionable trust intelligence.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-semibold text-white">{workspaceName}</div>
                  <div className="text-[11.5px] text-[#5a5a63] mt-0.5">{reportDate}</div>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#2a2a30] text-[10.5px] font-medium text-[#a1a1aa]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ff4d2e] shadow-[0_0_6px_rgba(255,77,46,0.8)]" />
                    Confidential
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-7 space-y-8">
              {/* Executive Summary */}
              <section>
                <SectionLabel icon={FileText} label="Executive Summary" />
                <div className="mt-3 rounded-xl border border-[#3a2418] bg-gradient-to-b from-[#1a1410] to-[#120e0a] p-5">
                  <p className="text-[13.5px] text-[#d8c8c0] leading-relaxed">
                    {summary.atRisk > 0
                      ? `${summary.atRisk} dataset${summary.atRisk === 1 ? "" : "s"} require urgent attention before use in reporting. ${summary.warning > 0 ? `${summary.warning} additional dataset${summary.warning === 1 ? "" : "s"} are in a warning state. ` : ""}Average trust score is ${summary.avg}/100 across ${summary.total} registered datasets. Review the risky datasets section and address the listed recommendations to improve data confidence.`
                      : summary.warning > 0
                        ? `${summary.warning} dataset${summary.warning === 1 ? "" : "s"} are in the warning band and should be reviewed by their owners. All ${summary.healthy} remaining datasets are healthy with complete metadata. Average trust score is ${summary.avg}/100.`
                        : `All ${summary.total} datasets are healthy with complete ownership and documentation. Average trust score is ${summary.avg}/100 — no critical issues detected across the registered catalog.`}
                  </p>
                </div>
              </section>

              {/* KPI Grid */}
              <section>
                <SectionLabel icon={BarChart3} label="Portfolio Overview" />
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBox value={summary.total} label="Total Datasets" tone="muted" />
                  <StatBox value={summary.healthy} label="Healthy" tone="success" />
                  <StatBox value={summary.warning} label="Warning" tone="warning" />
                  <StatBox value={summary.atRisk} label="At Risk" tone="danger" />
                </div>
                <div className="mt-3 rounded-xl border border-[#1f1f24] bg-[#0a0a0d] p-4 flex items-center gap-4">
                  <TrustRing score={summary.avg} size={56} />
                  <div>
                    <div className="text-[12px] text-[#6a6a73] font-medium uppercase tracking-wide">Average Trust Score</div>
                    <div className="mt-0.5 text-[22px] font-semibold tabular-nums text-white">{summary.avg}<span className="text-[14px] text-[#5a5a63] ml-1">/100</span></div>
                  </div>
                  <div className="ml-auto hidden sm:block text-right">
                    <div className="text-[11.5px] text-[#6a6a73]">{summary.healthy} healthy · {summary.warning} warning · {summary.atRisk} at risk</div>
                    <div className="mt-1 text-[11px] text-[#5a5a63]">across {summary.total} datasets</div>
                  </div>
                </div>
              </section>

              {/* Top Risky Datasets */}
              {risky.length > 0 && (
                <section>
                  <SectionLabel icon={ShieldAlert} label={`Top ${risky.length} Risky Datasets`} />
                  <div className="mt-3 rounded-xl border border-[#1f1f24] overflow-hidden">
                    <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr] px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63] bg-[#0a0a0d] border-b border-[#16161a]">
                      <div>Dataset</div>
                      <div>Source</div>
                      <div>Owner</div>
                      <div>Trust</div>
                    </div>
                    {risky.map((m) => (
                      <div
                        key={m.name}
                        className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr] items-center px-5 py-3.5 border-b border-[#101014] last:border-b-0 bg-[#0d0d10]"
                      >
                        <div className="text-[13px] font-semibold text-white">{m.name}</div>
                        <div className="text-[12px] text-[#a1a1aa]">{m.source}</div>
                        <div className="text-[12px] text-[#a1a1aa]">{m.owner || <span className="text-[#5a5a63] italic">Unassigned</span>}</div>
                        <div>
                          <span className={["inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", scoreColor(m.trust_score)].join(" ")}>
                            {m.trust_score}/100
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Full Dataset Table */}
              <section>
                <SectionLabel icon={ShieldCheck} label="Full Dataset Catalog" />
                <div className="mt-3 rounded-xl border border-[#1f1f24] overflow-hidden">
                  <div className="grid grid-cols-[2fr_1.2fr_1.4fr_0.8fr_1fr_1fr] px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63] bg-[#0a0a0d] border-b border-[#16161a]">
                    <div>Dataset</div>
                    <div>Source</div>
                    <div>Owner</div>
                    <div>Trust</div>
                    <div>Status</div>
                    <div>Updated</div>
                  </div>
                  {datasets.map((d) => (
                    <div
                      key={d.name}
                      className="group grid grid-cols-[2fr_1.2fr_1.4fr_0.8fr_1fr_1fr] items-center px-5 py-3.5 border-b border-[#101014] last:border-b-0 hover:bg-[#0f0f13] transition-colors"
                    >
                      <div className="text-[13px] font-medium text-white">{d.name}</div>
                      <div className="text-[12px] text-[#a1a1aa]">{d.source}</div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-[#1f1f24] flex items-center justify-center text-[9.5px] font-semibold text-[#a8a8b3] shrink-0">{d.ownerInitials}</div>
                        <span className="text-[12px] text-[#d8d8de] truncate">{d.ownerName}</span>
                      </div>
                      <div>
                        <span className={["inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", scoreColor(d.trust)].join(" ")}>
                          {d.trust}
                        </span>
                      </div>
                      <div>
                        <span className={["inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium", statusPill(d.status)].join(" ")}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {d.status}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-[#6a6a73]">{d.updated}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <section>
                  <SectionLabel icon={Lightbulb} label="Recommendations" />
                  <div className="mt-3 space-y-2.5">
                    {recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-xl border border-[#1f1f24] bg-[#0a0a0d] px-4 py-3.5"
                      >
                        <div className="h-6 w-6 rounded-md bg-[rgba(255,106,31,0.10)] ring-1 ring-[rgba(255,106,31,0.20)] flex items-center justify-center shrink-0 mt-0.5">
                          <Lightbulb className="h-3.5 w-3.5 text-[#ff7a59]" />
                        </div>
                        <p className="text-[12.5px] text-[#c8c8d0] leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Report Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-[#16161a] flex-wrap gap-3">
                <div className="text-[11px] text-[#5a5a63]">
                  TrustLayer · Data Trust Intelligence · {workspaceName}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadCsv(datasets, workspaceName)}
                    className="h-9 px-3.5 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[12px] font-medium text-white flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#34d399]" />
                    Download CSV
                  </button>
                  <button
                    onClick={() => openPdf(datasets, workspaceName)}
                    className="h-9 px-3.5 rounded-lg bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] text-white text-[12px] font-semibold flex items-center gap-2 shadow-[0_8px_24px_-10px_rgba(255,77,46,0.7),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:brightness-110 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Report
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 rounded-md bg-[rgba(255,106,31,0.10)] ring-1 ring-[rgba(255,106,31,0.18)] flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-[#ff7a59]" />
      </div>
      <h3 className="text-[13px] font-semibold tracking-tight text-white uppercase tracking-[0.10em] text-[11px]">
        {label}
      </h3>
    </div>
  );
}

function StatBox({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "success" | "warning" | "danger" | "muted";
}) {
  const map: Record<typeof tone, string> = {
    success: "text-[#34d399] bg-[rgba(52,211,153,0.06)] border-[rgba(52,211,153,0.20)]",
    warning: "text-[#fbbf24] bg-[rgba(251,191,36,0.06)] border-[rgba(251,191,36,0.20)]",
    danger: "text-[#f87171] bg-[rgba(248,113,113,0.06)] border-[rgba(248,113,113,0.22)]",
    muted: "text-white bg-[#0a0a0d] border-[#1f1f24]",
  };
  return (
    <div className={["rounded-xl border px-4 py-3.5", map[tone]].join(" ")}>
      <div className="text-[26px] font-semibold tabular-nums leading-none">{value}</div>
      <div className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] opacity-75">{label}</div>
    </div>
  );
}
