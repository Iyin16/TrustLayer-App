import { Link, useLocation } from "wouter";
import {
  Shield,
  LayoutGrid,
  Database,
  GitBranch,
  Sparkles,
  FileText,
  Settings,
} from "lucide-react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

type NavItem = { label: string; icon: React.ComponentType<{ className?: string }>; href: string };

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { label: "Datasets", icon: Database, href: "/datasets" },
  { label: "Lineage", icon: GitBranch, href: "/lineage" },
  { label: "AI Assistant", icon: Sparkles, href: "/assistant" },
  { label: "Reports", icon: FileText, href: "/reports" },
];

const secondaryItems: NavItem[] = [
  { label: "Settings", icon: Settings, href: "/settings" },
];

function NavButton({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={[
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all overflow-hidden",
        active
          ? "text-white bg-gradient-to-r from-[#1a1410] via-[#16161a] to-[#16161a] border border-[#2a1f18] shadow-[inset_0_1px_0_0_rgba(255,138,74,0.08),0_8px_20px_-12px_rgba(255,106,31,0.45)]"
          : "text-[#a1a1aa] hover:text-white hover:bg-[#101014] border border-transparent",
      ].join(" ")}
    >
      {active && (
        <>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-r bg-[#ff4d2e] shadow-[0_0_12px_rgba(255,106,31,0.8)]" />
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120px_40px_at_0%_50%,rgba(255,106,31,0.18),transparent_70%)]" />
        </>
      )}
      <Icon className={["relative h-[18px] w-[18px]", active ? "text-[#ff7a59] drop-shadow-[0_0_6px_rgba(255,106,31,0.6)]" : ""].join(" ")} />
      <span className="relative">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const isActive = (href: string) =>
    location === href || (href !== "/" && location.startsWith(href));

  return (
    <aside className="w-64 shrink-0 bg-[#0a0a0c] border-r border-[#16161a] flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-5 pb-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#ff4d2e] flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(255,106,31,0.6)]">
            <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[17px] font-semibold tracking-tight block leading-tight">TrustLayer</span>
            <span className="text-[10px] text-[#5a5a63] leading-tight block mt-0.5">Data trust intelligence</span>
          </div>
        </Link>
      </div>

      <div className="px-3">
        <WorkspaceSwitcher />
      </div>

      <div className="px-3 flex-1 mt-5">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63]">
          Navigation
        </div>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavButton key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </nav>

        <div className="mt-6 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5a5a63]">
          Account
        </div>
        <nav className="flex flex-col gap-0.5">
          {secondaryItems.map((item) => (
            <NavButton key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </nav>
      </div>

      <div className="relative m-3 rounded-xl border border-[#1f1f24] bg-gradient-to-b from-[#101014] to-[#0a0a0d] p-3.5 shadow-[0_10px_30px_-20px_rgba(255,106,31,0.4),inset_0_1px_0_0_rgba(255,255,255,0.03)] overflow-hidden">
        <span className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,106,31,0.18),transparent_70%)]" />
        <div className="relative flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="ember-pulse absolute inline-flex h-full w-full rounded-full bg-[#ff4d2e]"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff4d2e] shadow-[0_0_10px_rgba(255,106,31,0.9)]"></span>
          </span>
          <span className="text-[12.5px] font-medium text-white">All systems operational</span>
        </div>
        <div className="relative mt-1.5 text-[11px] text-[#6a6a73]">Last sync · 2 min ago</div>
      </div>
    </aside>
  );
}
