import { Search, Bell, Settings } from "lucide-react";

export function Header() {
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

          <div className="ml-2 flex items-center gap-3 pl-3 pr-3.5 py-1.5 rounded-xl border border-[#1f1f24] bg-[#0d0d10] hover:bg-[#101014] transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#ff4d2e] to-[#a8260f] flex items-center justify-center text-[11px] font-semibold text-white">
              AC
            </div>
            <div className="leading-tight">
              <div className="text-[12.5px] font-semibold text-white">Alex Carter</div>
              <div className="text-[10.5px] text-[#5a5a63]">Acme Corp</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
