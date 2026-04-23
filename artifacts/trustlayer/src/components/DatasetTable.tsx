import { useEffect, useRef, useState } from "react";
import { Filter, Pencil, Loader2, Database, Plus, AlertCircle, RefreshCw } from "lucide-react";
import { TrustRing } from "./TrustRing";
import { Card } from "./Layout";
import { datasets as defaultDatasets, statusPill, type Dataset } from "../lib/data";

type StatusFilter = "All" | Dataset["status"];
const STATUS_OPTIONS: StatusFilter[] = ["All", "Healthy", "Warning", "At Risk"];

export function DatasetTable({
  rows: rowsProp,
  title = "Datasets",
  subtitle,
  showFilters = true,
  loading = false,
  error,
  onRetry,
  onEdit,
  onCreate,
  emptyTitle = "No datasets yet",
  emptyDescription = "Add your first dataset to start tracking trust.",
}: {
  rows?: Dataset[];
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onEdit?: (ds: Dataset) => void;
  onCreate?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const rows = rowsProp ?? defaultDatasets;
  const [status, setStatus] = useState<StatusFilter>("All");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = status === "All" ? rows : rows.filter((d) => d.status === status);

  return (
    <Card>
      <div className="px-6 pt-6 pb-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-[12.5px] text-[#a1a1aa]">
            {subtitle ??
              `${filtered.length}${status !== "All" ? ` of ${rows.length}` : ""} datasets · sorted by trust score`}
          </p>
        </div>
        {showFilters && (
          <div className="flex items-center gap-2">
            <button
              disabled
              className="h-9 px-3.5 rounded-lg border border-[#2a2a30] bg-[#0d0d10] text-[12.5px] font-medium text-white flex items-center gap-1.5 opacity-60 cursor-not-allowed"
            >
              <Filter className="h-3.5 w-3.5" />
              All sources
            </button>
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className={[
                  "h-9 px-3.5 rounded-lg border text-[12.5px] font-medium text-white flex items-center gap-1.5 transition-colors",
                  status === "All"
                    ? "border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a]"
                    : "border-[#3a2418] bg-gradient-to-b from-[#241712] to-[#1a1410] shadow-[inset_0_1px_0_0_rgba(255,138,74,0.12),0_4px_14px_-6px_rgba(255,106,31,0.5)]",
                ].join(" ")}
              >
                <Filter className="h-3.5 w-3.5" />
                {status === "All" ? "All statuses" : status}
              </button>
              {open && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-[180px] rounded-xl border border-[#1f1f24] bg-[#0d0d10] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] overflow-hidden z-20">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setStatus(opt);
                        setOpen(false);
                      }}
                      className={[
                        "w-full px-3.5 py-2.5 text-left text-[12.5px] hover:bg-[#101014] transition-colors flex items-center justify-between",
                        status === opt ? "text-white" : "text-[#a1a1aa]",
                      ].join(" ")}
                    >
                      {opt}
                      {status === opt && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#ff4d2e] shadow-[0_0_6px_rgba(255,77,46,0.7)]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[#16161a]">
        <div className="grid grid-cols-[2fr_1.4fr_1.2fr_0.8fr_1fr_auto] px-6 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63] border-b border-[#16161a]">
          <div>Dataset</div>
          <div>Owner</div>
          <div>Last Updated</div>
          <div>Trust</div>
          <div>Status</div>
          <div />
        </div>

        {loading ? (
          <div className="px-6 py-16 flex items-center justify-center text-[#a1a1aa] text-[12.5px] gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#ff4d2e]" />
            Loading your datasets…
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-[rgba(248,113,113,0.10)] ring-1 ring-[rgba(248,113,113,0.28)] flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-[#f87171]" />
            </div>
            <div className="mt-4 text-[14px] font-semibold text-white">Couldn't load datasets</div>
            <div className="mt-1 text-[12.5px] text-[#a1a1aa] max-w-md mx-auto">{error}</div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[12.5px] font-medium text-white transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try again
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-[rgba(255,106,31,0.08)] ring-1 ring-[rgba(255,106,31,0.18)] flex items-center justify-center">
              <Database className="h-5 w-5 text-[#ff7a59]" />
            </div>
            <div className="mt-4 text-[14px] font-semibold text-white">
              {rows.length === 0 ? emptyTitle : `No ${status.toLowerCase()} datasets`}
            </div>
            <div className="mt-1 text-[12.5px] text-[#a1a1aa]">
              {rows.length === 0 ? emptyDescription : "Try a different status filter."}
            </div>
            {rows.length === 0 && onCreate && (
              <button
                onClick={onCreate}
                className="mt-5 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] text-white text-[12.5px] font-semibold shadow-[0_8px_24px_-10px_rgba(255,77,46,0.7),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:brightness-110 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Add dataset
              </button>
            )}
          </div>
        ) : (
          filtered.map((ds) => (
            <div
              key={ds.name}
              className="group grid grid-cols-[2fr_1.4fr_1.2fr_0.8fr_1fr_auto] items-center px-6 py-4 border-b border-[#101014] last:border-b-0 hover:bg-[#101014]/60 transition-colors"
            >
              <div>
                <div className="text-[13.5px] font-medium text-white">{ds.name}</div>
                <div className="text-[11.5px] text-[#5a5a63] mt-0.5">
                  {ds.source} · {ds.domain}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-[#1f1f24] flex items-center justify-center text-[10.5px] font-semibold text-[#a8a8b3]">
                  {ds.ownerInitials}
                </div>
                <span className="text-[13px] text-[#d8d8de]">{ds.ownerName}</span>
              </div>
              <div className="text-[12.5px] text-[#a1a1aa]">{ds.updated}</div>
              <div>
                <TrustRing score={ds.trust} />
              </div>
              <div>
                <span
                  className={[
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium",
                    statusPill(ds.status),
                  ].join(" ")}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {ds.status}
                </span>
              </div>
              <div className="flex items-center justify-end">
                {onEdit && (
                  <button
                    onClick={() => onEdit(ds)}
                    title="Edit dataset"
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-[#5a5a63] hover:text-white hover:bg-[#16161a] transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
