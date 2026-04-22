import { Filter } from "lucide-react";
import { TrustRing } from "./TrustRing";
import { Card } from "./Layout";
import { datasets as defaultDatasets, statusPill, type Dataset } from "../lib/data";

export function DatasetTable({
  rows = defaultDatasets,
  title = "Datasets",
  subtitle,
  showFilters = true,
}: {
  rows?: Dataset[];
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
}) {
  return (
    <Card>
      <div className="px-6 pt-6 pb-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-[12.5px] text-[#8a8a93]">
            {subtitle ?? `${rows.length} datasets · sorted by trust score`}
          </p>
        </div>
        {showFilters && (
          <div className="flex items-center gap-2">
            <button className="h-9 px-3.5 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[12.5px] font-medium text-white flex items-center gap-1.5 transition-colors">
              <Filter className="h-3.5 w-3.5" />
              All sources
            </button>
            <button className="h-9 px-3.5 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[12.5px] font-medium text-white flex items-center gap-1.5 transition-colors">
              <Filter className="h-3.5 w-3.5" />
              All statuses
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-[#16161a]">
        <div className="grid grid-cols-[2fr_1.4fr_1.2fr_0.8fr_1fr] px-6 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63] border-b border-[#16161a]">
          <div>Dataset</div>
          <div>Owner</div>
          <div>Last Updated</div>
          <div>Trust</div>
          <div>Status</div>
        </div>

        <div>
          {rows.map((ds) => (
            <div
              key={ds.name}
              className="grid grid-cols-[2fr_1.4fr_1.2fr_0.8fr_1fr] items-center px-6 py-4 border-b border-[#101014] last:border-b-0 hover:bg-[#101014]/60 transition-colors"
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
              <div className="text-[12.5px] text-[#8a8a93]">{ds.updated}</div>
              <div>
                <TrustRing score={ds.trust} />
              </div>
              <div>
                <span className={["inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium", statusPill(ds.status)].join(" ")}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {ds.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
