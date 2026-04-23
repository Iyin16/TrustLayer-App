import { useState } from "react";
import { Shield, Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth";

type Mode = "login" | "signup";

export default function Login() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        await signup(name.trim() || email.split("@")[0], email.trim(), password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

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
            {mode === "login" ? "Welcome back" : "Create account"}
          </div>
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight text-white">
            {mode === "login" ? "Sign in to TrustLayer" : "Join TrustLayer"}
          </h1>
          <p className="mt-1.5 text-[13px] text-[#a1a1aa]">
            {mode === "login"
              ? "Access your data trust intelligence workspace."
              : "Start monitoring trust across your data stack."}
          </p>

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
            <Field icon={Lock} label="Password">
              <input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={mode === "signup" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                className="w-full bg-transparent outline-none text-[13.5px] text-white placeholder:text-[#5a5a63]"
              />
            </Field>

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
                  {mode === "login" ? "Sign in" : "Create account"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-[12.5px] text-[#a1a1aa]">
            {mode === "login" ? "New to TrustLayer?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode(mode === "login" ? "signup" : "login");
              }}
              className="text-[#ff7a59] hover:text-[#ff5a35] font-medium transition-colors"
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
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
