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
  Lock,
  Key,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Monitor,
  Smartphone,
  Shield,
} from "lucide-react";
import { PageHeader, EmberButton, GhostButton, Card } from "../components/Layout";
import { OpenMetadataModal } from "../components/OpenMetadataModal";
import { useAuth } from "../lib/auth";
import { useWorkspace } from "../lib/workspace";
import {
  loadOrCreateProfile,
  updateProfile,
  clampThreshold,
  generateApiToken,
  TIMEZONE_OPTIONS,
  type UserProfile,
} from "../lib/profile";
import { account } from "../lib/appwrite";

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

const MOCK_DEVICES = [
  { id: "dev-1", name: "Chrome on macOS", type: "desktop", current: true, lastSeen: "Active now" },
  { id: "dev-2", name: "Safari on iPhone", type: "mobile", current: false, lastSeen: "2 days ago" },
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

  const [resetEmail, setResetEmail] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [resetInfo, setResetInfo] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const [tokenVisible, setTokenVisible] = useState(false);
  const [tokenGenerating, setTokenGenerating] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [confirmRegen, setConfirmRegen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    setResetEmail(user.email ?? "");
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

  async function handlePasswordReset() {
    if (!user) return;
    setResetSending(true);
    setResetInfo(null);
    setResetError(null);
    try {
      const url = `${window.location.origin}${import.meta.env.BASE_URL}`;
      await account.createRecovery(resetEmail.trim(), url);
      setResetInfo("Password reset link sent. Check your inbox — it may take a minute.");
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : "Couldn't send reset email.");
    } finally {
      setResetSending(false);
    }
  }

  async function handleGenerateToken(force = false) {
    if (!user) return;
    if (profile?.api_token && !force) {
      setConfirmRegen(true);
      return;
    }
    setConfirmRegen(false);
    setTokenGenerating(true);
    setTokenError(null);
    try {
      const token = generateApiToken();
      const next = await updateProfile(user, { ...draft!, api_token: token });
      setProfile(next);
      setDraft(next);
      setTokenVisible(true);
    } catch (err: unknown) {
      setTokenError(err instanceof Error ? err.message : "Couldn't save token.");
    } finally {
      setTokenGenerating(false);
    }
  }

  function handleCopyToken() {
    if (!profile?.api_token) return;
    navigator.clipboard.writeText(profile.api_token).then(() => {
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    });
  }

  const maskedToken = profile?.api_token
    ? profile.api_token.slice(0, 7) + "••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage your profile, notifications, integrations, and security."
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
        {/* ── Profile ─────────────────────────────────────────────────── */}
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

        {/* ── Organization ────────────────────────────────────────────── */}
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

        {/* ── Notifications ────────────────────────────────────────────── */}
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
                <div className="text-[13px] font-medium text-white">Risk threshold</div>
                <div className="text-[12px] text-[#a1a1aa]">
                  Alert when a dataset's trust score drops by more than this many points.
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
              Preferences are stored in your Appwrite account. Delivery is configured
              separately when notification channels are connected.
            </span>
          </div>
        </SectionCard>

        {/* ── Security ─────────────────────────────────────────────────── */}
        <SectionCard
          icon={Lock}
          title="Security"
          description="Manage your password, sessions, and trusted devices."
        >
          {/* Current session */}
          <div className="mb-5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63] mb-3">
              Current session
            </div>
            <div className="rounded-lg border border-[#1f1f24] bg-[#0a0a0d] px-4 py-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[rgba(255,106,31,0.08)] ring-1 ring-[rgba(255,106,31,0.18)] flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-[#ff7a59]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-white truncate">
                  {user?.email ?? "—"}
                </div>
                <div className="text-[11.5px] text-[#5a5a63] mt-0.5">
                  Account ID: {user?.$id?.slice(0, 16) ?? "—"}…
                </div>
              </div>
              <span className="shrink-0 text-[10.5px] font-semibold px-2 py-1 rounded-full bg-[rgba(52,211,153,0.1)] text-[#34d399] ring-1 ring-[rgba(52,211,153,0.2)]">
                Active
              </span>
            </div>
          </div>

          {/* Password reset */}
          <div className="mb-5 border-t border-[#101014] pt-5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63] mb-3">
              Password reset
            </div>
            <div className="space-y-3">
              <Field
                label="Send reset link to"
                value={resetEmail}
                type="email"
                onChange={setResetEmail}
                placeholder="you@company.com"
              />
              {resetInfo && (
                <div className="flex items-start gap-2 rounded-lg border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.06)] px-3 py-2 text-[12px] text-[#86efac]">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{resetInfo}</span>
                </div>
              )}
              {resetError && (
                <div className="rounded-lg border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]">
                  {resetError}
                </div>
              )}
              <button
                type="button"
                onClick={() => void handlePasswordReset()}
                disabled={resetSending || !resetEmail.trim()}
                className="h-9 px-4 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[12.5px] font-medium text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetSending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5 text-[#ff7a59]" />
                )}
                {resetSending ? "Sending…" : "Send reset link"}
              </button>
            </div>
          </div>

          {/* Trusted devices */}
          <div className="border-t border-[#101014] pt-5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63] mb-3">
              Trusted devices
            </div>
            <div className="space-y-2">
              {MOCK_DEVICES.map((dev) => (
                <div
                  key={dev.id}
                  className="rounded-lg border border-[#1f1f24] bg-[#0a0a0d] px-3.5 py-3 flex items-center gap-3"
                >
                  <div className="shrink-0 text-[#5a5a63]">
                    {dev.type === "mobile" ? (
                      <Smartphone className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-white">{dev.name}</div>
                    <div className="text-[11.5px] text-[#5a5a63]">{dev.lastSeen}</div>
                  </div>
                  {dev.current ? (
                    <span className="shrink-0 text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(52,211,153,0.1)] text-[#34d399] ring-1 ring-[rgba(52,211,153,0.2)]">
                      This device
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="shrink-0 text-[11.5px] text-[#fca5a5] hover:text-[#f87171] transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ── API Tokens ───────────────────────────────────────────────── */}
        <SectionCard
          icon={Key}
          title="API Tokens"
          description="Generate a personal token to access the TrustLayer API."
        >
          {profile?.api_token ? (
            <div className="space-y-4">
              <div>
                <div className="text-[12px] font-medium text-[#a8a8b3] mb-1.5">Your API token</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-10 px-3.5 rounded-lg bg-[#0d0d10] border border-[#1f1f24] text-[12px] text-white font-mono flex items-center overflow-hidden">
                    <span className="truncate">
                      {tokenVisible ? profile.api_token : maskedToken}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTokenVisible((v) => !v)}
                    title={tokenVisible ? "Hide token" : "Reveal token"}
                    className="h-10 w-10 rounded-lg border border-[#1f1f24] bg-[#0d0d10] hover:bg-[#16161a] flex items-center justify-center shrink-0 transition-colors"
                  >
                    {tokenVisible ? (
                      <EyeOff className="h-4 w-4 text-[#a1a1aa]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[#a1a1aa]" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    title="Copy token"
                    className="h-10 w-10 rounded-lg border border-[#1f1f24] bg-[#0d0d10] hover:bg-[#16161a] flex items-center justify-center shrink-0 transition-colors"
                  >
                    {tokenCopied ? (
                      <CheckCircle2 className="h-4 w-4 text-[#34d399]" />
                    ) : (
                      <Copy className="h-4 w-4 text-[#a1a1aa]" />
                    )}
                  </button>
                </div>
                <div className="mt-1.5 text-[11px] text-[#5a5a63]">
                  Treat this like a password — don't share it publicly.
                </div>
              </div>

              {confirmRegen ? (
                <div className="rounded-lg border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.06)] px-4 py-3 space-y-3">
                  <div className="text-[12.5px] text-[#fca5a5]">
                    Regenerating will invalidate your current token immediately. Any services using it will stop working.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleGenerateToken(true)}
                      disabled={tokenGenerating}
                      className="h-8 px-3 rounded-lg bg-[rgba(248,113,113,0.15)] border border-[rgba(248,113,113,0.3)] text-[12px] font-medium text-[#fca5a5] hover:bg-[rgba(248,113,113,0.25)] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {tokenGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Yes, regenerate
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRegen(false)}
                      className="h-8 px-3 rounded-lg border border-[#2a2a30] bg-[#0d0d10] text-[12px] font-medium text-[#a1a1aa] hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleGenerateToken(false)}
                  disabled={tokenGenerating}
                  className="h-9 px-4 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[12.5px] font-medium text-[#a1a1aa] hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate token
                </button>
              )}

              {tokenError && (
                <div className="rounded-lg border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]">
                  {tokenError}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#1f1f24] bg-[#0a0a0d] px-4 py-4 text-center">
                <Key className="h-6 w-6 text-[#3a3a40] mx-auto mb-2" />
                <div className="text-[13px] font-medium text-[#a1a1aa]">No API token yet</div>
                <div className="text-[12px] text-[#5a5a63] mt-0.5">
                  Generate a token to authenticate API requests.
                </div>
              </div>
              {tokenError && (
                <div className="rounded-lg border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]">
                  {tokenError}
                </div>
              )}
              <button
                type="button"
                onClick={() => void handleGenerateToken(true)}
                disabled={tokenGenerating || loading}
                className="w-full h-10 rounded-xl bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-[0_8px_24px_-10px_rgba(255,77,46,0.6),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {tokenGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                {tokenGenerating ? "Generating…" : "Generate API token"}
              </button>
            </div>
          )}
        </SectionCard>

        {/* ── Integrations / OpenMetadata ──────────────────────────────── */}
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
