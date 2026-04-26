import { useEffect, useMemo, useState } from "react";
import {
  Save,
  User,
  Building2,
  Bell,
  Plug,
  Network,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";
import { PageHeader, EmberButton, GhostButton, Card } from "../components/Layout";
import { OpenMetadataModal } from "../components/OpenMetadataModal";
import { useAuth } from "../lib/auth";
import { useWorkspace } from "../lib/workspace";
import {
  loadOrCreateProfile,
  updateProfile,
  clampThreshold,
  TIMEZONE_OPTIONS,
  type UserProfile,
} from "../lib/profile";

function Field({
  label,
  value,
  onChange,
  hint,
  type = "text",
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  hint?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-[12px] font-medium text-[#a8a8b3] mb-1.5">{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full h-10 px-3.5 rounded-lg bg-[#0d0d10] border border-[#1f1f24] text-[13px] text-white focus:outline-none focus:border-[#3a2418] focus:ring-2 focus:ring-[rgba(255,77,46,0.12)] transition-colors disabled:opacity-60"
      />
      {hint && <div className="mt-1.5 text-[11.5px] text-[#5a5a63]">{hint}</div>}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="text-[12px] font-medium text-[#a8a8b3] mb-1.5">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg bg-[#0d0d10] border border-[#1f1f24] text-[13px] text-white focus:outline-none focus:border-[#3a2418] focus:ring-2 focus:ring-[rgba(255,77,46,0.12)] transition-colors"
      >
        <option value="" className="bg-[#0d0d10]">
          Select…
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0d0d10]">
            {o}
          </option>
        ))}
      </select>
      {hint && <div className="mt-1.5 text-[11.5px] text-[#5a5a63]">{hint}</div>}
    </label>
  );
}

function Toggle({
  label,
  description,
  on,
  onChange,
}: {
  label: string;
  description: string;
  on: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-[#101014] last:border-b-0">
      <div>
        <div className="text-[13px] font-medium text-white">{label}</div>
        <div className="mt-0.5 text-[12px] text-[#a1a1aa]">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange?.(!on)}
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

const ROLE_OPTIONS = [
  "Data Engineer",
  "Analytics Engineer",
  "Data Scientist",
  "Data Analyst",
  "Data Platform Lead",
  "VP Data",
  "Engineering Manager",
  "Other",
];

export default function Settings() {
  const { user, refresh } = useAuth();
  const { openMetadata, disconnectOpenMetadata } = useWorkspace();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [omOpen, setOmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    setLoading(true);
    loadOrCreateProfile(user)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setDraft(p);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Couldn't load profile.";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const dirty = useMemo(() => {
    if (!profile || !draft) return false;
    return (
      profile.full_name !== draft.full_name ||
      profile.role !== draft.role ||
      profile.organization !== draft.organization ||
      profile.timezone !== draft.timezone ||
      profile.notifications_enabled !== draft.notifications_enabled ||
      profile.risk_threshold !== draft.risk_threshold
    );
  }, [profile, draft]);

  function patch<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setSavedAt(null);
  }

  async function handleSave() {
    if (!user || !draft) return;
    setSaving(true);
    setError(null);
    try {
      const next = await updateProfile(user, draft);
      setProfile(next);
      setDraft(next);
      setSavedAt(Date.now());
      // Pull the updated user (esp. if full_name was synced to account.name)
      // so the header avatar reflects the change.
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't save changes.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    if (profile) setDraft(profile);
    setSavedAt(null);
    setError(null);
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage your profile, notifications, and integrations."
        actions={
          <>
            <GhostButton onClick={handleDiscard}>Discard</GhostButton>
            <EmberButton icon={saving ? Loader2 : Save} onClick={() => void handleSave()}>
              {saving ? "Saving…" : "Save changes"}
            </EmberButton>
          </>
        }
      />

      {error && (
        <div className="rounded-xl border border-[rgba(248,113,113,0.28)] bg-[rgba(248,113,113,0.06)] px-4 py-3 text-[12.5px] text-[#fca5a5]">
          {error}
        </div>
      )}
      {savedAt && !dirty && !saving && (
        <div className="rounded-xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.05)] px-4 py-3 flex items-center gap-2 text-[12.5px] text-[#34d399]">
          <CheckCircle2 className="h-4 w-4" />
          Settings saved.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard
          icon={User}
          title="Profile"
          description="How you appear inside TrustLayer."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Full name"
              value={draft?.full_name ?? ""}
              placeholder="Your name"
              onChange={(v) => patch("full_name", v)}
            />
            <SelectField
              label="Role"
              value={draft?.role ?? ""}
              onChange={(v) => patch("role", v)}
              options={ROLE_OPTIONS}
            />
            <Field
              label="Email"
              value={user?.email ?? ""}
              type="email"
              disabled
              hint="Managed by your account."
            />
            <SelectField
              label="Timezone"
              value={draft?.timezone ?? ""}
              onChange={(v) => patch("timezone", v)}
              options={TIMEZONE_OPTIONS}
            />
          </div>
          {loading && (
            <div className="mt-4 text-[11.5px] text-[#5a5a63] flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading profile…
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={Building2}
          title="Organization"
          description="The team or company this workspace belongs to."
        >
          <div className="grid grid-cols-1 gap-4">
            <Field
              label="Organization"
              value={draft?.organization ?? ""}
              placeholder="Your company or team"
              onChange={(v) => patch("organization", v)}
            />
            <Field
              label="Account ID"
              value={user?.$id ?? ""}
              disabled
              hint="Used to scope your datasets in Appwrite."
            />
          </div>
        </SectionCard>

        <SectionCard
          icon={Bell}
          title="Notifications"
          description="Control alerts for trust score changes."
        >
          <Toggle
            label="Enable notifications"
            description="Receive alerts when dataset trust scores drop."
            on={draft?.notifications_enabled ?? false}
            onChange={(v) => patch("notifications_enabled", v)}
          />
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[13px] font-medium text-white">
                  Risk threshold
                </div>
                <div className="text-[12px] text-[#a1a1aa]">
                  Alert when a dataset's trust score drops by more than this
                  many points.
                </div>
              </div>
              <span className="text-[15px] font-semibold text-white tabular-nums">
                {draft?.risk_threshold ?? 5}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={draft?.risk_threshold ?? 5}
              onChange={(e) =>
                patch("risk_threshold", clampThreshold(Number(e.target.value)))
              }
              disabled={!draft?.notifications_enabled}
              className="w-full accent-[#ff4d2e] h-2 disabled:opacity-50"
            />
            <div className="mt-1 flex justify-between text-[10.5px] text-[#5a5a63]">
              <span>1 pt</span>
              <span>50 pts</span>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-[#1f1f24] bg-[#0a0a0d] px-3 py-2.5 text-[11.5px] text-[#a1a1aa] flex items-start gap-2">
            <Mail className="h-3.5 w-3.5 mt-0.5 text-[#ff7a59] shrink-0" />
            <span>
              Preferences are stored in your Appwrite account. Delivery is
              configured separately when notification channels are connected.
            </span>
          </div>
        </SectionCard>

        <SectionCard
          icon={Plug}
          title="Integrations"
          description="Connect a metadata source to import datasets."
        >
          <div className="rounded-lg border border-[#1f1f24] bg-[#0a0a0d] p-4 flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#16161a] border border-[#1f1f24] flex items-center justify-center shrink-0">
              <Network className="h-4 w-4 text-[#ff7a59]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-white">OpenMetadata</div>
              {openMetadata ? (
                <>
                  <div className="text-[11.5px] text-[#a1a1aa] mt-0.5 truncate">
                    Connected · {openMetadata.url}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => setOmOpen(true)}
                      className="h-9 px-3 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[12px] font-medium text-white transition-colors"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => disconnectOpenMetadata()}
                      className="h-9 px-3 rounded-lg text-[12px] font-medium text-[#fca5a5] hover:text-[#f87171] hover:bg-[rgba(248,113,113,0.08)] transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[11.5px] text-[#a1a1aa] mt-0.5">
                    Not connected. Add a server URL and token to import datasets.
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => setOmOpen(true)}
                      className="h-9 px-3 rounded-lg bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-[0_8px_24px_-10px_rgba(255,77,46,0.7),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:brightness-110"
                    >
                      <Network className="h-3.5 w-3.5" />
                      Connect OpenMetadata
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <OpenMetadataModal open={omOpen} onClose={() => setOmOpen(false)} />
    </>
  );
}
