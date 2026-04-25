import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Search, Bell, Settings, LogOut, Loader2 } from "lucide-react";
import { useAuth, userInitials } from "../lib/auth";
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

export function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
      setConfirmOpen(false);
    }
  }

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const name = user?.name || user?.email || "Account";
  const email = user?.email || "";
  const initials = userInitials(user?.name || user?.email);

  return (
    <header className="h-16 border-b border-[#16161a] bg-[#08080a]/80 backdrop-blur-xl sticky top-0 z-10">
      <div className="h-full px-8 flex items-center gap-6">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a5a63]" />
            <input
              type="search"
              placeholder="Search datasets, owners, lineage..."
              className="w-full h-10 pl-10 pr-14 rounded-lg bg-[#0d0d10] border border-[#1f1f24] text-[13px] placeholder:text-[#5a5a63] text-white focus:outline-none focus:border-[#2a2a30] transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium text-[#a1a1aa] border border-[#2a2a30] bg-[#16161a]">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="relative h-9 w-9 rounded-lg flex items-center justify-center text-[#a1a1aa] hover:text-white hover:bg-[#101014] transition-colors">
            <Bell className="h-[17px] w-[17px]" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#ff4d2e]" />
          </button>
          <button className="h-9 w-9 rounded-lg flex items-center justify-center text-[#a1a1aa] hover:text-white hover:bg-[#101014] transition-colors">
            <Settings className="h-[17px] w-[17px]" />
          </button>

          <div ref={menuRef} className="relative ml-2">
            <button
              onClick={() => setOpen((v) => !v)}
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

            {open && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-[240px] rounded-xl border border-[#1f1f24] bg-[#0d0d10] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
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
                  onClick={() => setOpen(false)}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[12.5px] text-[#a1a1aa] hover:bg-[#101014] hover:text-white transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Account settings
                </Link>
                <div className="h-px bg-[#16161a]" />
                <button
                  onClick={() => {
                    setOpen(false);
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
    </header>
  );
}
