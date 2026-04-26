import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  Bell,
  Settings,
  LogOut,
  Loader2,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  X,
  Database,
} from "lucide-react";
import { useAuth, userInitials } from "../lib/auth";
import { useWorkspace } from "../lib/workspace";
import { datasets as demoDatasets, statusPill, type Dataset } from "../lib/data";
import { docToDataset, listMyDatasets } from "../lib/datasets";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Notification = {
  id: string;
  icon: "danger" | "warning" | "success" | "info";
  title: string;
  body: string;
  href?: string;
};

function buildNotifications(datasets: Dataset[]): Notification[] {
  const notes: Notification[] = [];
  const atRisk = datasets.filter((d) => d.status === "At Risk");
  const noOwner = datasets.filter(
    (d) => !d.ownerName || /^(unassigned|n\/a|tbd|none|unknown|-)$/i.test(d.ownerName.trim()),
  );
  const warning = datasets.filter((d) => d.status === "Warning");

  for (const d of atRisk.slice(0, 3)) {
    notes.push({
      id: `risk-${d.name}`,
      icon: "danger",
      title: `${d.name} is At Risk`,
      body: `Trust score ${d.trust}/100 — review before use in reporting.`,
      href: `/datasets/${d.name}`,
    });
  }
  if (noOwner.length > 0) {
    const names = noOwner
      .slice(0, 2)
      .map((d) => d.name)
      .join(", ");
    notes.push({
      id: "no-owner",
      icon: "warning",
      title: `${noOwner.length} dataset${noOwner.length === 1 ? "" : "s"} without an owner`,
      body: `${names}${noOwner.length > 2 ? ` +${noOwner.length - 2} more` : ""} — assign owners to improve trust scores.`,
      href: "/datasets",
    });
  }
  for (const d of warning.slice(0, 2)) {
    if (atRisk.find((a) => a.name === d.name)) continue;
    notes.push({
      id: `warn-${d.name}`,
      icon: "warning",
      title: `${d.name} needs attention`,
      body: `Trust score ${d.trust}/100 — metadata gaps detected.`,
      href: `/datasets/${d.name}`,
    });
  }
  if (notes.length === 0 && datasets.length > 0) {
    notes.push({
      id: "all-healthy",
      icon: "success",
      title: "All datasets healthy",
      body: `${datasets.length} datasets with complete ownership and metadata. No action needed.`,
    });
  }
  if (datasets.length === 0) {
    notes.push({
      id: "empty",
      icon: "info",
      title: "No datasets registered",
      body: "Add your first dataset from the dashboard to start tracking trust.",
      href: "/dashboard",
    });
  }
  return notes;
}

function NotificationIcon({ type }: { type: Notification["icon"] }) {
  if (type === "danger") return <ShieldAlert className="h-3.5 w-3.5 text-[#f87171]" />;
  if (type === "warning") return <AlertTriangle className="h-3.5 w-3.5 text-[#fbbf24]" />;
  if (type === "success") return <ShieldCheck className="h-3.5 w-3.5 text-[#34d399]" />;
  return <Database className="h-3.5 w-3.5 text-[#ff7a59]" />;
}

function notifRingColor(type: Notification["icon"]) {
  if (type === "danger") return "ring-[rgba(248,113,113,0.28)] bg-[rgba(248,113,113,0.10)]";
  if (type === "warning") return "ring-[rgba(251,191,36,0.28)] bg-[rgba(251,191,36,0.10)]";
  if (type === "success") return "ring-[rgba(52,211,153,0.28)] bg-[rgba(52,211,153,0.10)]";
  return "ring-[rgba(255,106,31,0.28)] bg-[rgba(255,106,31,0.10)]";
}

export function Header() {
  const { user, logout } = useAuth();
  const { mode, resetWorkspace } = useWorkspace();
  const [, navigate] = useLocation();
  const isDemo = mode === "demo";

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [bellOpen, setBellOpen] = useState(false);
  const [bellSeen, setBellSeen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dsLoading, setDsLoading] = useState(false);
  const [dsLoaded, setDsLoaded] = useState(false);

  const loadDatasets = useCallback(async () => {
    if (dsLoaded || dsLoading) return;
    setDsLoading(true);
    try {
      if (isDemo) {
        setDatasets([...demoDatasets]);
      } else if (user) {
        const docs = await listMyDatasets(user.$id);
        setDatasets(docs.map(docToDataset));
      }
      setDsLoaded(true);
    } catch {
      setDsLoaded(true);
    } finally {
      setDsLoading(false);
    }
  }, [dsLoaded, dsLoading, isDemo, user]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        void loadDatasets();
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setBellOpen(false);
        setMenuOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [loadDatasets]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const notifications = useMemo(() => buildNotifications(datasets), [datasets]);
  const urgentCount = useMemo(
    () => notifications.filter((n) => n.icon === "danger" || n.icon === "warning").length,
    [notifications],
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return datasets.slice(0, 8);
    return datasets
      .filter((d) =>
        `${d.name} ${d.ownerName} ${d.source} ${d.status}`.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [searchQuery, datasets]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
      setConfirmOpen(false);
    }
  }

  function openSearch() {
    setSearchOpen(true);
    void loadDatasets();
  }

  function openBell() {
    setBellOpen((v) => !v);
    setBellSeen(true);
    void loadDatasets();
  }

  function goToResult(ds: Dataset) {
    navigate(`/datasets/${ds.name}`);
    setSearchOpen(false);
  }

  const name = user?.name || user?.email || "Account";
  const email = user?.email || "";
  const initials = userInitials(user?.name || user?.email);
  const showBadge = !bellSeen && urgentCount > 0;

  return (
    <>
      <header className="h-16 border-b border-[#16161a] bg-[#08080a]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="h-full px-8 flex items-center gap-6">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a5a63]" />
              <input
                readOnly
                type="text"
                placeholder="Search datasets, owners, sources…"
                onClick={openSearch}
                className="w-full h-10 pl-10 pr-14 rounded-lg bg-[#0d0d10] border border-[#1f1f24] text-[13px] placeholder:text-[#5a5a63] text-white focus:outline-none hover:border-[#2a2a30] transition-colors cursor-pointer"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium text-[#a1a1aa] border border-[#2a2a30] bg-[#16161a]">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div ref={bellRef} className="relative">
              <button
                onClick={openBell}
                className="relative h-9 w-9 rounded-lg flex items-center justify-center text-[#a1a1aa] hover:text-white hover:bg-[#101014] transition-colors"
              >
                <Bell className="h-[17px] w-[17px]" />
                {showBadge && (
                  <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#ff4d2e] shadow-[0_0_6px_rgba(255,77,46,0.7)]" />
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] rounded-xl border border-[#1f1f24] bg-[#0d0d10] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] overflow-hidden z-20">
                  <div className="px-4 py-3 border-b border-[#16161a] flex items-center justify-between">
                    <div>
                      <span className="text-[12.5px] font-semibold text-white">Notifications</span>
                      {urgentCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(248,113,113,0.15)] text-[#f87171] border border-[rgba(248,113,113,0.25)]">
                          {urgentCount}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setBellOpen(false)}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-[#5a5a63] hover:text-white hover:bg-[#101014] transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {dsLoading ? (
                      <div className="px-4 py-6 flex items-center justify-center gap-2 text-[12px] text-[#a1a1aa]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ff7a59]" />
                        Loading…
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const inner = (
                          <div className="flex items-start gap-3 px-4 py-3.5 border-b border-[#101014] last:border-b-0 hover:bg-[#101014] transition-colors cursor-pointer">
                            <div
                              className={[
                                "h-7 w-7 rounded-lg ring-1 flex items-center justify-center shrink-0 mt-0.5",
                                notifRingColor(n.icon),
                              ].join(" ")}
                            >
                              <NotificationIcon type={n.icon} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12.5px] font-medium text-white leading-snug">
                                {n.title}
                              </div>
                              <div className="mt-0.5 text-[11.5px] text-[#a1a1aa] leading-relaxed">
                                {n.body}
                              </div>
                            </div>
                          </div>
                        );
                        return n.href ? (
                          <Link
                            key={n.id}
                            href={n.href}
                            onClick={() => setBellOpen(false)}
                            className="block"
                          >
                            {inner}
                          </Link>
                        ) : (
                          <div key={n.id}>{inner}</div>
                        );
                      })
                    )}
                  </div>

                  <div className="px-4 py-2.5 border-t border-[#16161a]">
                    <Link
                      href="/datasets"
                      onClick={() => setBellOpen(false)}
                      className="text-[11.5px] text-[#ff7a59] hover:text-[#ff9a79] transition-colors"
                    >
                      View all datasets →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Settings shortcut */}
            <Link
              href="/settings"
              className="h-9 w-9 rounded-lg flex items-center justify-center text-[#a1a1aa] hover:text-white hover:bg-[#101014] transition-colors"
              title="Settings"
            >
              <Settings className="h-[17px] w-[17px]" />
            </Link>

            {/* User menu */}
            <div ref={menuRef} className="relative ml-2">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-3 pl-3 pr-3.5 py-1.5 rounded-xl border border-[#1f1f24] bg-[#0d0d10] hover:bg-[#101014] transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#ff4d2e] to-[#a8260f] flex items-center justify-center text-[11px] font-semibold text-white">
                  {initials}
                </div>
                <div className="leading-tight text-left">
                  <div className="text-[12.5px] font-semibold text-white max-w-[140px] truncate">
                    {name}
                  </div>
                  <div className="text-[10.5px] text-[#5a5a63] max-w-[140px] truncate">
                    {email || "Signed in"}
                  </div>
                </div>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-[240px] rounded-xl border border-[#1f1f24] bg-[#0d0d10] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] overflow-hidden z-20">
                  <div className="px-3.5 py-3 border-b border-[#16161a] flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#ff4d2e] to-[#a8260f] flex items-center justify-center text-[11.5px] font-semibold text-white shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-semibold text-white truncate">{name}</div>
                      <div className="text-[11px] text-[#5a5a63] truncate">{email}</div>
                    </div>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[12.5px] text-[#a1a1aa] hover:bg-[#101014] hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Account settings
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      resetWorkspace();
                    }}
                    className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[12.5px] text-[#a1a1aa] hover:bg-[#101014] hover:text-white transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Show onboarding
                  </button>
                  <div className="h-px bg-[#16161a]" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmOpen(true);
                    }}
                    className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[12.5px] text-[#a1a1aa] hover:bg-[#101014] hover:text-white transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search palette */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-[#04040680] backdrop-blur-sm" aria-hidden="true" />
          <div className="relative w-full max-w-[600px] rounded-2xl border border-[#1f1f24] bg-[#0d0d10] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#16161a]">
              <Search className="h-4.5 w-4.5 text-[#5a5a63] shrink-0 h-[18px] w-[18px]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search datasets, owners, sources…"
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-[#5a5a63] outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="h-5 w-5 rounded-md flex items-center justify-center text-[#5a5a63] hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <kbd
                onClick={() => setSearchOpen(false)}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium text-[#a1a1aa] border border-[#2a2a30] bg-[#16161a] cursor-pointer hover:bg-[#1f1f24] transition-colors"
              >
                Esc
              </kbd>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {dsLoading ? (
                <div className="px-4 py-8 flex items-center justify-center gap-2 text-[13px] text-[#a1a1aa]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#ff7a59]" />
                  Loading datasets…
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-[#5a5a63]">
                  No datasets match "{searchQuery}"
                </div>
              ) : (
                <>
                  {!searchQuery && (
                    <div className="px-4 pt-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63]">
                      All datasets
                    </div>
                  )}
                  {searchQuery && (
                    <div className="px-4 pt-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63]">
                      {searchResults.length} result{searchResults.length === 1 ? "" : "s"}
                    </div>
                  )}
                  {searchResults.map((ds) => (
                    <button
                      key={ds.name}
                      onClick={() => goToResult(ds)}
                      className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-[#101014] transition-colors text-left"
                    >
                      <div className="h-9 w-9 rounded-xl bg-[#16161a] border border-[#1f1f24] flex items-center justify-center shrink-0">
                        <Database className="h-4 w-4 text-[#ff7a59]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium text-white truncate">
                          {ds.name}
                        </div>
                        <div className="text-[11.5px] text-[#5a5a63] mt-0.5">
                          {ds.source} · {ds.ownerName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={[
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border",
                            ds.trust >= 80
                              ? "text-[#34d399] bg-[rgba(52,211,153,0.10)] border-[rgba(52,211,153,0.28)]"
                              : ds.trust >= 60
                                ? "text-[#fbbf24] bg-[rgba(251,191,36,0.10)] border-[rgba(251,191,36,0.28)]"
                                : "text-[#f87171] bg-[rgba(248,113,113,0.10)] border-[rgba(248,113,113,0.28)]",
                          ].join(" ")}
                        >
                          {ds.trust}
                        </span>
                        <span
                          className={[
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium",
                            statusPill(ds.status),
                          ].join(" ")}
                        >
                          <span className="h-1 w-1 rounded-full bg-current" />
                          {ds.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-[#16161a] flex items-center gap-4 text-[11px] text-[#5a5a63]">
              <span><kbd className="px-1 py-0.5 rounded border border-[#2a2a30] bg-[#16161a] text-[10px] font-medium text-[#a1a1aa]">↵</kbd> to open</span>
              <span><kbd className="px-1 py-0.5 rounded border border-[#2a2a30] bg-[#16161a] text-[10px] font-medium text-[#a1a1aa]">Esc</kbd> to close</span>
              <span className="ml-auto">{datasets.length} dataset{datasets.length === 1 ? "" : "s"} indexed</span>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-[#1f1f24] bg-[#0d0d10] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Sign out of TrustLayer?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#a1a1aa]">
              {email
                ? `You'll be signed out of ${email} on this device. You can sign back in anytime.`
                : "You'll be signed out on this device. You can sign back in anytime."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={signingOut}
              className="border-[#1f1f24] bg-transparent text-[#a1a1aa] hover:bg-[#101014] hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSignOut();
              }}
              disabled={signingOut}
              className="bg-gradient-to-b from-[#ff5a35] to-[#ff3a1c] text-white hover:brightness-110"
            >
              {signingOut ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Signing out…
                </span>
              ) : (
                "Sign out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
