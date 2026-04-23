import { useEffect, useState } from "react";
import {
  Shield,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { account } from "../lib/appwrite";

type Mode = "login" | "signup" | "forgot" | "reset";

export default function Login() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryUserId, setRecoveryUserId] = useState<string | null>(null);
  const [recoverySecret, setRecoverySecret] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    const secret = params.get("secret");
    if (userId && secret) {
      setRecoveryUserId(userId);
      setRecoverySecret(secret);
      setMode("reset");
    }
  }, []);

  function switchMode(next: Mode) {
    setError(null);
    setInfo(null);
    setPassword("");
    setMode(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        await signup(name.trim() || email.split("@")[0], email.trim(), password);
      } else if (mode === "forgot") {
        const url = `${window.location.origin}${import.meta.env.BASE_URL}`;
        await account.createRecovery(email.trim(), url);
        setInfo("Check your inbox for a reset link. It may take a minute to arrive.");
      } else if (mode === "reset") {
        if (!recoveryUserId || !recoverySecret) {
          throw new Error("Recovery link is invalid or expired. Request a new one.");
        }
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        await account.updateRecovery(recoveryUserId, recoverySecret, password);
        setInfo("Password updated. You can now sign in.");
        const url = new URL(window.location.href);
        url.searchParams.delete("userId");
        url.searchParams.delete("secret");
        url.searchParams.delete("expire");
        window.history.replaceState({}, "", url.toString());
        setRecoveryUserId(null);
        setRecoverySecret(null);
        setPassword("");
        setMode("login");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  const copy = {
    login: {
      kicker: "Welcome back",
      title: "Sign in to TrustLayer",
      sub: "Access your data trust intelligence workspace.",
      cta: "Sign in",
    },
    signup: {
      kicker: "Create account",
      title: "Join TrustLayer",
      sub: "Start monitoring trust across your data stack.",
      cta: "Create account",
    },
    forgot: {
      kicker: "Password recovery",
      title: "Reset your password",
      sub: "Enter your email and we'll send you a secure reset link.",
      cta: "Send reset link",
    },
    reset: {
      kicker: "New password",
      title: "Choose a new password",
      sub: "Pick something strong — at least 8 characters.",
      cta: "Update password",
    },
  }[mode];

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-10%] right-[-5%] h-[520px] w-[680px] rounded-full bg-[radial-gradient(circle,rgba(255,77,46,0.14),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] h-[520px] w-[680px] rounded-full bg-[radial-gradient(circle,rgba(255,122,89,0.08),transparent_65%)] blur-3xl" />
      </div>

      <div className="w-full max-w-[420px]">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#ff4d2e] to-[#a8260f] flex items-center justify-center shadow-[0_0_24px_rgba(255,77,46,0.35)]">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="text-[20px] font-semibold tracking-tight text-white">TrustLayer</div>
        </div>

        <div className="rounded-2xl border border-[#1f1f24] bg-gradient-to-b from-[#121215] to-[#0a0a0d] p-7 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_40px_80px_-24px_rgba(0,0,0,0.8)]">
          <div className="text-[10.5px] font-semibold tracking-[0.22em] uppercase text-[#5a5a63]">
            {copy.kicker}
          </div>
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight text-white">
            {copy.title}
          </h1>
          <p className="mt-1.5 text-[13px] text-[#a1a1aa]">{copy.sub}</p>

          <form onSubmit={submit} className="mt-6 space-y-3.5">
            {mode === "signup" && (
              <Field icon={UserIcon} label="Name">
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Carter"
                  className="w-full bg-transparent outline-none text-[13.5px] text-white placeholder:text-[#5a5a63]"
                />
              </Field>
            )}

            {(mode === "login" || mode === "signup" || mode === "forgot") && (
              <Field icon={Mail} label="Email">
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-transparent outline-none text-[13.5px] text-white placeholder:text-[#5a5a63]"
                />
              </Field>
            )}

            {(mode === "login" || mode === "signup" || mode === "reset") && (
              <Field icon={Lock} label={mode === "reset" ? "New password" : "Password"}>
                <input
                  type="password"
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : mode === "signup"
                        ? "new-password"
                        : "new-password"
                  }
                  required
                  minLength={mode === "signup" || mode === "reset" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "signup" || mode === "reset" ? "At least 8 characters" : "••••••••"
                  }
                  className="w-full bg-transparent outline-none text-[13.5px] text-white placeholder:text-[#5a5a63]"
                />
              </Field>
            )}

            {mode === "login" && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-[11.5px] text-[#a1a1aa] hover:text-[#ff7a59] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {info && (
              <div className="flex items-start gap-2 rounded-lg border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.06)] px-3 py-2 text-[12px] text-[#86efac]">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{info}</span>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="group relative w-full h-11 rounded-xl bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 shadow-[0_10px_32px_-10px_rgba(255,77,46,0.7),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:brightness-110 active:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {copy.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-[12.5px] text-[#a1a1aa]">
            {mode === "login" && (
              <>
                New to TrustLayer?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-[#ff7a59] hover:text-[#ff5a35] font-medium transition-colors"
                >
                  Create account
                </button>
              </>
            )}
            {mode === "signup" && (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-[#ff7a59] hover:text-[#ff5a35] font-medium transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
            {(mode === "forgot" || mode === "reset") && (
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="inline-flex items-center gap-1.5 text-[#a1a1aa] hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-[#5a5a63]">
          Protected by Appwrite · Session persisted on this device
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-[#5a5a63] mb-1.5">
        {label}
      </div>
      <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl bg-[#0a0a0d] border border-[#1f1f24] focus-within:border-[#3a2418] focus-within:shadow-[0_0_0_3px_rgba(255,77,46,0.08)] transition-all">
        <Icon className="h-4 w-4 text-[#5a5a63] shrink-0" />
        {children}
      </div>
    </label>
  );
}
