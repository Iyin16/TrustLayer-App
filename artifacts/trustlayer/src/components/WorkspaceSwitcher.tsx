import { useEffect, useRef, useState } from "react";
import { Sparkles, Database, Check, ChevronDown, Network, RotateCcw } from "lucide-react";
import { useWorkspace, type WorkspaceMode } from "../lib/workspace";
import { OpenMetadataModal } from "./OpenMetadataModal";

const LABELS: Record<WorkspaceMode, { label: string; sub: string }> = {
  demo: { label: "Demo Workspace", sub: "Sample enterprise data" },
  user: { label: "Your Workspace", sub: "Private to you" },
};

export function WorkspaceSwitcher() {
  const { mode, setMode, openMetadata, resetWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [omOpen, setOmOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = mode ? LABELS[mode] : { label: "No workspace", sub: "Choose to begin" };
  const Icon = mode === "demo" ? Sparkles : Database;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#1f1f24] bg-[#0d0d10] hover:bg-[#101014] transition-colors text-left"
      >
        <span
          className={[
            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
            mode === "demo"
              ? "bg-gradient-to-br from-[#ff4d2e] to-[#a8260f] shadow-[0_0_14px_rgba(255,77,46,0.35)]"
              : "bg-[#16161a] border border-[#1f1f24]",
          ].join(" ")}
        >
          <Icon
            className={mode === "demo" ? "h-4 w-4 text-white" : "h-4 w-4 text-[#ff7a59]"}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold text-white truncate">
            {current.label}
          </div>
          <div className="text-[10.5px] text-[#5a5a63] truncate">{current.sub}</div>
        </div>
        <ChevronDown
          className={[
            "h-3.5 w-3.5 text-[#5a5a63] transition-transform shrink-0",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] rounded-xl border border-[#1f1f24] bg-[#0d0d10] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] overflow-hidden z-30">
          <Option
            icon={Sparkles}
            label="Demo Workspace"
            description="Realistic enterprise sample data"
            active={mode === "demo"}
            tone="ember"
            onClick={() => {
              setMode("demo");
              setOpen(false);
            }}
          />
          <div className="h-px bg-[#16161a]" />
          <Option
            icon={Database}
            label="Your Workspace"
            description="Private datasets you've created"
            active={mode === "user"}
            onClick={() => {
              setMode("user");
              setOpen(false);
            }}
          />
          <div className="h-px bg-[#16161a]" />
          <button
            onClick={() => {
              setOmOpen(true);
              setOpen(false);
            }}
            className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[12px] text-[#a1a1aa] hover:bg-[#101014] hover:text-white transition-colors"
          >
            <Network className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">
              {openMetadata ? "Manage OpenMetadata" : "Connect OpenMetadata"}
            </span>
            {openMetadata && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
            )}
          </button>
          <div className="h-px bg-[#16161a]" />
          <button
            onClick={() => {
              resetWorkspace();
              setOpen(false);
            }}
            className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[12px] text-[#a1a1aa] hover:bg-[#101014] hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Show onboarding again
          </button>
        </div>
      )}

      <OpenMetadataModal open={omOpen} onClose={() => setOmOpen(false)} />
    </div>
  );
}

function Option({
  icon: Icon,
  label,
  description,
  active,
  tone,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  active: boolean;
  tone?: "ember";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-[#101014] transition-colors text-left"
    >
      <span
        className={[
          "h-7 w-7 rounded-md flex items-center justify-center shrink-0",
          tone === "ember"
            ? "bg-gradient-to-br from-[#ff4d2e] to-[#a8260f]"
            : "bg-[#16161a] border border-[#1f1f24]",
        ].join(" ")}
      >
        <Icon
          className={tone === "ember" ? "h-3.5 w-3.5 text-white" : "h-3.5 w-3.5 text-[#ff7a59]"}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium text-white truncate">{label}</div>
        <div className="text-[10.5px] text-[#5a5a63] truncate">{description}</div>
      </div>
      {active && (
        <Check className="h-3.5 w-3.5 text-[#ff7a59] shrink-0" strokeWidth={2.5} />
      )}
    </button>
  );
}
