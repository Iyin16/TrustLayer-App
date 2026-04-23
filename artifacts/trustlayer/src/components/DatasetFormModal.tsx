import { useEffect, useState } from "react";
import { X, Database, Loader2, Sparkles } from "lucide-react";

const SOURCES = ["Snowflake", "BigQuery", "Postgres", "Redshift", "Databricks"] as const;

export type DatasetFormValues = {
  name: string;
  source: string;
  domain: string;
  ownerName: string;
};

export type DatasetFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<DatasetFormValues>;
  defaultOwnerName?: string;
  onClose: () => void;
  onSubmit: (values: DatasetFormValues) => Promise<void>;
};

export function DatasetFormModal({
  open,
  mode,
  initial,
  defaultOwnerName,
  onClose,
  onSubmit,
}: DatasetFormModalProps) {
  const [name, setName] = useState("");
  const [source, setSource] = useState<string>(SOURCES[0]);
  const [domain, setDomain] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
    setName(initial?.name ?? "");
    setSource(initial?.source ?? SOURCES[0]);
    setDomain(initial?.domain ?? "");
    setOwnerName(initial?.ownerName ?? defaultOwnerName ?? "");
  }, [open, initial, defaultOwnerName]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanName = name.trim();
    const cleanDomain = domain.trim();
    const cleanOwner = ownerName.trim();
    if (!cleanName) return setError("Dataset name is required.");
    if (!/^[a-z0-9_]+$/i.test(cleanName.replace(/\s+/g, "_"))) {
      return setError("Dataset name should contain only letters, numbers, and underscores.");
    }
    if (!cleanDomain) return setError("Domain is required.");
    if (!cleanOwner) return setError("Owner name is required.");
    setBusy(true);
    try {
      await onSubmit({
        name: cleanName.replace(/\s+/g, "_"),
        source,
        domain: cleanDomain,
        ownerName: cleanOwner,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't save dataset.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#04040680] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[460px] rounded-2xl border border-[#1f1f24] bg-gradient-to-b from-[#121215] to-[#0a0a0d] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        <span className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,77,46,0.18),transparent_65%)] blur-2xl" />

        <div className="relative px-6 pt-6 pb-5 border-b border-[#16161a] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#ff4d2e] to-[#a8260f] flex items-center justify-center shadow-[0_0_24px_rgba(255,77,46,0.35)]">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-[#5a5a63]">
                {mode === "create" ? "New dataset" : "Edit dataset"}
              </div>
              <h3 className="mt-1 text-[17px] font-semibold tracking-tight text-white">
                {mode === "create" ? "Register a dataset" : "Update dataset"}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-[#a1a1aa] hover:text-white hover:bg-[#101014] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative px-6 py-5 space-y-3.5">
          <Field label="Name">
            <input
              autoFocus
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="customer_events"
              className="w-full bg-transparent outline-none text-[13.5px] text-white placeholder:text-[#5a5a63]"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-transparent outline-none text-[13.5px] text-white appearance-none cursor-pointer"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s} className="bg-[#0d0d10]">
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Domain">
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="growth"
                className="w-full bg-transparent outline-none text-[13.5px] text-white placeholder:text-[#5a5a63]"
              />
            </Field>
          </div>

          <Field label="Owner">
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Alex Carter"
              className="w-full bg-transparent outline-none text-[13.5px] text-white placeholder:text-[#5a5a63]"
            />
          </Field>

          {mode === "create" && (
            <div className="flex items-start gap-2 rounded-lg border border-[#1f1f24] bg-[#0a0a0d] px-3 py-2.5 text-[11.5px] text-[#a1a1aa]">
              <Sparkles className="h-3.5 w-3.5 mt-0.5 text-[#ff7a59] shrink-0" />
              <span>
                Trust score is auto-generated on creation based on initial signal availability.
                You'll be able to recompute it from the row menu.
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-[#2a2a30] bg-[#0d0d10] hover:bg-[#16161a] text-[12.5px] font-medium text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-10 px-4 rounded-lg bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] text-white text-[12.5px] font-semibold flex items-center gap-2 shadow-[0_8px_24px_-10px_rgba(255,77,46,0.7),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:brightness-110 active:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === "create" ? "Create dataset" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-[#5a5a63] mb-1.5">
        {label}
      </div>
      <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl bg-[#0a0a0d] border border-[#1f1f24] focus-within:border-[#3a2418] focus-within:shadow-[0_0_0_3px_rgba(255,77,46,0.08)] transition-all">
        {children}
      </div>
    </label>
  );
}
