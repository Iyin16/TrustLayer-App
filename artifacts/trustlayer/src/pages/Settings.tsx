import { Save, User, Building2, Bell, Shield, Plug, KeyRound } from "lucide-react";
import { PageHeader, EmberButton, GhostButton, Card } from "../components/Layout";

function Field({
  label,
  value,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  hint?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="text-[12px] font-medium text-[#a8a8b3] mb-1.5">{label}</div>
      <input
        type={type}
        defaultValue={value}
        className="w-full h-10 px-3.5 rounded-lg bg-[#0d0d10] border border-[#1f1f24] text-[13px] text-white focus:outline-none focus:border-[#2a2a30] transition-colors"
      />
      {hint && <div className="mt-1.5 text-[11.5px] text-[#5a5a63]">{hint}</div>}
    </label>
  );
}

function Toggle({ label, description, on }: { label: string; description: string; on: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-[#101014] last:border-b-0">
      <div>
        <div className="text-[13px] font-medium text-white">{label}</div>
        <div className="mt-0.5 text-[12px] text-[#a1a1aa]">{description}</div>
      </div>
      <button
        className={[
          "relative h-6 w-11 rounded-full transition-colors shrink-0 mt-0.5",
          on
            ? "bg-gradient-to-r from-[#ff5a35] to-[#ff3a1c] shadow-[0_0_16px_-4px_rgba(255,106,31,0.7)]"
            : "bg-[#1f1f24]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow",
            on ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3.5">
        <div className="h-9 w-9 rounded-lg bg-[rgba(255,106,31,0.08)] ring-1 ring-[rgba(255,106,31,0.18)] flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-[#ff7a59]" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-white">{title}</h3>
          <p className="mt-0.5 text-[12.5px] text-[#a1a1aa]">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

const integrations = [
  { name: "Snowflake", status: "Connected", host: "acme.snowflakecomputing.com" },
  { name: "BigQuery", status: "Connected", host: "acme-prod.gcp" },
  { name: "Postgres", status: "Connected", host: "db.acme.internal" },
  { name: "Redshift", status: "Connected", host: "warehouse.acme.aws" },
];

export default function Settings() {
  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage your profile, organization, integrations, and notification preferences."
        actions={
          <>
            <GhostButton>Discard</GhostButton>
            <EmberButton icon={Save}>Save changes</EmberButton>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard icon={User} title="Profile" description="How you appear inside TrustLayer.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" value="Alex Carter" />
            <Field label="Role" value="Data Platform Lead" />
            <Field label="Email" value="alex@acme.com" type="email" />
            <Field label="Timezone" value="America / Los Angeles" />
          </div>
        </SectionCard>

        <SectionCard icon={Building2} title="Organization" description="Workspace shared with your team.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Workspace name" value="Acme Corp" />
            <Field label="Plan" value="Enterprise" hint="Renews on Jan 14, 2027" />
            <Field label="Default warehouse" value="Snowflake — prod" />
            <Field label="Seats in use" value="34 of 50" />
          </div>
        </SectionCard>

        <SectionCard icon={Bell} title="Notifications" description="Pick which trust events alert you.">
          <Toggle label="Trust score drops" description="Notify when any dataset drops more than 5 points." on={true} />
          <Toggle label="Schema changes" description="Notify when an upstream schema changes." on={true} />
          <Toggle label="Freshness anomalies" description="Notify when sync lag exceeds expected SLA." on={false} />
          <Toggle label="Weekly digest" description="A Monday summary of warehouse health." on={true} />
        </SectionCard>

        <SectionCard icon={Shield} title="Security" description="Account access and authentication.">
          <Toggle label="Two-factor authentication" description="Required for all admin actions." on={true} />
          <Toggle label="Single sign-on (Okta)" description="Allow team members to sign in with SSO." on={true} />
          <Toggle label="Session auto-lock" description="Lock the dashboard after 30 minutes of inactivity." on={false} />
        </SectionCard>

        <SectionCard icon={Plug} title="Integrations" description="Warehouses and tools wired into TrustLayer.">
          <div className="divide-y divide-[#101014]">
            {integrations.map((i) => (
              <div key={i.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <div className="text-[13px] font-medium text-white">{i.name}</div>
                  <div className="text-[11.5px] text-[#5a5a63] mt-0.5">{i.host}</div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[rgba(52,211,153,0.10)] text-[#34d399] border border-[rgba(52,211,153,0.25)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {i.status}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={KeyRound} title="API tokens" description="Programmatic access to your TrustLayer workspace.">
          <div className="rounded-lg border border-[#1f1f24] bg-[#0d0d10] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-white">Production API key</div>
                <div className="mt-0.5 text-[11.5px] text-[#5a5a63]">Last used 14 minutes ago</div>
              </div>
              <code className="text-[11.5px] text-[#a1a1aa] font-mono">tl_live_••••••••e4f2</code>
            </div>
          </div>
          <div className="mt-3">
            <EmberButton icon={KeyRound}>Generate new key</EmberButton>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
