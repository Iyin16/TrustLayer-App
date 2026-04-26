import { useState } from "react";
import {
  Shield,
  Sparkles,
  Database,
  Network,
  Plus,
  ArrowRight,
  CheckCircle2,
  Activity,
  GitBranch,
  ShieldCheck,
} from "lucide-react";
import { useAuth, userInitials } from "../lib/auth";
import { useWorkspace } from "../lib/workspace";
import { OpenMetadataModal } from "../components/OpenMetadataModal";

export default function Onboarding() {
  const { user } = useAuth();
  const { setMode } = useWorkspace();
  const [omOpen, setOmOpen] = useState(false);

  const greeting = (() => {
    const n = user?.name?.trim();
    if (n) return n.split(/\s+/)[0];
    if (user?.email) return user.email.split("@")[0];
    return "there";
  })();

  return (
    <div className="min-h-screen bg-[#08080a] text-white relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full bg-[radial-gradient(circle,rgba(255,106,31,0.16),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(255,77,46,0.10),transparent_65%)] blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.4))]" />
      </div>

      <div className="relative z-10 max-w-[1100px] mx-auto px-6 pt-12 pb-16">
        {/* brand bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#ff4d2e] flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(255,106,31,0.6)]">
              <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[17px] font-semibold tracking-tight">TrustLayer</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-[#1f1f24] bg-[#0d0d10] pl-3 pr-3.5 py-1.5">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#ff4d2e] to-[#a8260f] flex items-center justify-center text-[10.5px] font-semibold text-white">
              {userInitials(user?.name || user?.email)}
            </div>
            <div className="leading-tight">
              <div className="text-[12px] font-semibold text-white max-w-[160px] truncate">
                {user?.name || user?.email}
              </div>
              <div className="text-[10.5px] text-[#5a5a63]">Signed in</div>
            </div>
          </div>
        </div>

        {/* hero */}
        <div className="mt-14 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold tracking-[0.18em] uppercase border border-[#3a2418] bg-gradient-to-b from-[#241712] to-[#1a1410] text-[#ff7a59] shadow-[inset_0_1px_0_0_rgba(255,138,74,0.12)]">
            <Sparkles className="h-3 w-3" />
            Choose your workspace
          </div>
          <h1 className="mt-5 text-[40px] leading-[1.05] font-semibold tracking-[-0.02em]">
            Welcome,{" "}
            <span className="bg-gradient-to-r from-[#ff7a59] via-[#ff4d2e] to-[#ff3a1c] bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(255,77,46,0.35)]">
              {greeting}
            </span>
          </h1>
          <p className="mt-3 text-[14.5px] text-[#9a9aa3] max-w-[560px] mx-auto leading-relaxed">
            Take TrustLayer for a spin with realistic enterprise sample data, or start fresh
            with your own datasets. You can switch workspaces anytime.
          </p>
        </div>

        {/* options */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
          <ChoiceCard
            badge="Recommended"
            icon={Sparkles}
            title="Explore Demo Workspace"
            description="Loaded with realistic enterprise datasets, trust scores, alerts, lineage, and analytics so you can see TrustLayer in action immediately."
            features={[
              { icon: Database, label: "7 sample datasets across 5 sources" },
              { icon: ShieldCheck, label: "Pre-computed trust scores & alerts" },
              { icon: GitBranch, label: "Lineage and dependency graph" },
              { icon: Activity, label: "Quality test history" },
            ]}
            primary={{
              label: "Explore demo",
              icon: ArrowRight,
              onClick: () => setMode("demo"),
            }}
            highlight
          />

          <ChoiceCard
            icon={Database}
            title="Start With Your Own Data"
            description="Begin with a clean workspace. Add datasets manually, or connect your OpenMetadata instance to ingest catalog metadata, owners, and lineage."
            features={[
              { icon: Plus, label: "Register datasets manually" },
              { icon: Network, label: "Connect OpenMetadata workspace" },
              { icon: ShieldCheck, label: "Auto trust scoring on save" },
              { icon: CheckCircle2, label: "Per-user private workspace" },
            ]}
            primary={{
              label: "Add datasets manually",
              icon: Plus,
              onClick: () => setMode("user"),
            }}
            secondary={{
              label: "Connect OpenMetadata",
              icon: Network,
              onClick: () => setOmOpen(true),
            }}
          />
        </div>

        <div className="mt-10 text-center text-[11.5px] text-[#5a5a63]">
          You can switch between Demo and Your workspace anytime from the sidebar.
        </div>
      </div>

      <OpenMetadataModal open={omOpen} onClose={() => setOmOpen(false)} />
    </div>
  );
}

type ChoiceAction = {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick: () => void;
};

function ChoiceCard({
  badge,
  icon: Icon,
  title,
  description,
  features,
  primary,
  secondary,
  highlight,
}: {
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  features: { icon: React.ComponentType<{ className?: string }>; label: string }[];
  primary: ChoiceAction;
  secondary?: ChoiceAction;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "relative rounded-2xl border bg-gradient-to-b from-[#121215] to-[#0a0a0d] p-6 overflow-hidden transition-all",
        highlight
          ? "border-[#3a2418] shadow-[0_30px_60px_-24px_rgba(255,77,46,0.35),inset_0_1px_0_0_rgba(255,138,74,0.1)]"
          : "border-[#1f1f24] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.7)]",
      ].join(" ")}
    >
      {highlight && (
        <span className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,77,46,0.22),transparent_65%)] blur-2xl" />
      )}

      <div className="relative flex items-start justify-between">
        <div
          className={[
            "h-11 w-11 rounded-xl flex items-center justify-center",
            highlight
              ? "bg-gradient-to-br from-[#ff4d2e] to-[#a8260f] shadow-[0_0_24px_rgba(255,77,46,0.35)]"
              : "bg-[#16161a] border border-[#1f1f24]",
          ].join(" ")}
        >
          <Icon className={highlight ? "h-5 w-5 text-white" : "h-5 w-5 text-[#ff7a59]"} />
        </div>
        {badge && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold tracking-[0.14em] uppercase border border-[#3a2418] bg-gradient-to-b from-[#241712] to-[#1a1410] text-[#ff7a59]">
            {badge}
          </span>
        )}
      </div>

      <h3 className="relative mt-5 text-[20px] font-semibold tracking-tight text-white">
        {title}
      </h3>
      <p className="relative mt-2 text-[13px] text-[#a1a1aa] leading-relaxed">
        {description}
      </p>

      <ul className="relative mt-5 space-y-2">
        {features.map((f) => {
          const FIcon = f.icon;
          return (
            <li
              key={f.label}
              className="flex items-center gap-2.5 text-[12.5px] text-[#d8d8de]"
            >
              <span className="h-6 w-6 rounded-md bg-[#0a0a0d] border border-[#1f1f24] flex items-center justify-center">
                <FIcon className="h-3.5 w-3.5 text-[#ff7a59]" />
              </span>
              {f.label}
            </li>
          );
        })}
      </ul>

      <div className="relative mt-6 flex items-center gap-2 flex-wrap">
        <PrimaryAction action={primary} />
        {secondary && <SecondaryAction action={secondary} />}
      </div>
    </div>
  );
}

function PrimaryAction({ action }: { action: ChoiceAction }) {
  const Icon = action.icon;
  return (
    <button
      onClick={action.onClick}
      className="h-11 px-4 rounded-lg bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] text-white text-[13px] font-semibold flex items-center gap-2 shadow-[0_10px_30px_-6px_rgba(255,106,31,0.55),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:brightness-110 active:brightness-95 transition"
    >
      {action.label}
      <Icon className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}

function SecondaryAction({ action }: { action: ChoiceAction }) {
  const Icon = action.icon;
  return (
    <button
      onClick={action.onClick}
      className="h-11 px-4 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[13px] font-medium text-white flex items-center gap-2 transition-colors"
    >
      <Icon className="h-4 w-4" />
      {action.label}
    </button>
  );
}
