import { useState } from "react";
import {
  Sparkles,
  Send,
  MessageSquare,
  Bot,
  User,
  Wand2,
  Database,
  GitBranch,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Paperclip,
  Plus,
} from "lucide-react";
import { PageHeader, EmberButton, GhostButton, Card } from "../components/Layout";
import { TrustRing } from "../components/TrustRing";

type MetadataCard =
  | { kind: "dataset"; name: string; source: string; trust: number; owner: string }
  | { kind: "lineage"; from: string; to: string; health: "healthy" | "warning" | "risk" }
  | { kind: "stat"; label: string; value: string; delta: string };

type Message = {
  role: "user" | "assistant";
  text: string;
  metadata?: MetadataCard[];
};

const seedConversation: Message[] = [
  { role: "user", text: "Why did the trust score for marketing_attribution drop this week?" },
  {
    role: "assistant",
    text:
      "marketing_attribution dropped 8 points (from 79 → 71) on Apr 19. Two upstream changes correlate: a schema change in hubspot_export removed the campaign_id column, and a 4-hour ingestion lag on Apr 18. I recommend reviewing the dbt model attribution_join.sql with Diego Alvarez.",
    metadata: [
      { kind: "dataset", name: "marketing_attribution", source: "Redshift · marketing", trust: 71, owner: "Diego Alvarez" },
      { kind: "lineage", from: "hubspot_export", to: "marketing_attribution", health: "warning" },
      { kind: "stat", label: "Trust delta (7d)", value: "-8", delta: "vs +2 prior week" },
    ],
  },
];

const suggestionGroups = [
  {
    icon: TrendingUp,
    title: "Investigate trust changes",
    items: [
      "Summarize this week's trust changes",
      "Why did marketing_attribution drop this week?",
      "Which datasets improved the most?",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Audit data health",
    items: [
      "Find datasets with stale schemas",
      "List datasets missing an owner",
      "Show all datasets below 60 trust",
    ],
  },
  {
    icon: GitBranch,
    title: "Trace lineage",
    items: [
      "Explain the lineage for revenue_daily",
      "What dashboards depend on customer_events?",
      "Which models break if hubspot_export changes?",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Draft and remediate",
    items: [
      "Draft an incident report for legacy_invoices",
      "Write a Slack message to the finance team",
      "Propose a remediation plan for AR Aging",
    ],
  },
];

function MetadataBlock({ m }: { m: MetadataCard }) {
  if (m.kind === "dataset") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[#1f1f24] bg-[#0a0a0d] px-3.5 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <TrustRing score={m.trust} size={40} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-[#ff8a4a]" />
            <span className="text-[12.5px] font-semibold text-white truncate">{m.name}</span>
          </div>
          <div className="text-[11px] text-[#8a8a93] mt-0.5 truncate">{m.source} · {m.owner}</div>
        </div>
      </div>
    );
  }
  if (m.kind === "lineage") {
    const dot = m.health === "healthy" ? "bg-[#34d399]" : m.health === "warning" ? "bg-[#fbbf24]" : "bg-[#f87171]";
    return (
      <div className="rounded-xl border border-[#1f1f24] bg-[#0a0a0d] px-3.5 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2">
          <GitBranch className="h-3.5 w-3.5 text-[#ff8a4a]" />
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-[#5a5a63] font-semibold">Lineage edge</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md border border-[#2a2a30] bg-[#0d0d10] text-[11.5px] text-white">{m.from}</span>
          <span className={["h-1.5 w-1.5 rounded-full", dot].join(" ")} />
          <ArrowUpRight className="h-3 w-3 text-[#5a5a63] rotate-45" />
          <span className="px-2 py-0.5 rounded-md border border-[#2a2a30] bg-[#0d0d10] text-[11.5px] text-white">{m.to}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[#1f1f24] bg-[#0a0a0d] px-3.5 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#5a5a63] font-semibold">{m.label}</div>
      <div className="mt-1.5 text-[20px] font-semibold tracking-tight text-white leading-none">{m.value}</div>
      <div className="mt-1.5 text-[11px] text-[#8a8a93]">{m.delta}</div>
    </div>
  );
}

function MessageBubble({ m }: { m: Message }) {
  if (m.role === "user") {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[78%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed bg-gradient-to-b from-[#ff7a35] to-[#ff5a0f] text-white shadow-[0_8px_24px_-10px_rgba(255,106,31,0.6)]">
          {m.text}
        </div>
        <div className="h-8 w-8 shrink-0 rounded-lg bg-[#1f1f24] flex items-center justify-center">
          <User className="h-4 w-4 text-[#a8a8b3]" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 shrink-0 rounded-lg bg-[rgba(255,106,31,0.10)] ring-1 ring-[rgba(255,106,31,0.25)] flex items-center justify-center">
        <Bot className="h-4 w-4 text-[#ff8a4a]" />
      </div>
      <div className="max-w-[82%] space-y-3">
        <div className="rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed bg-[#101014] border border-[#1f1f24] text-[#e0e0e7] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
          {m.text}
        </div>
        {m.metadata && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {m.metadata.map((md, i) => <MetadataBlock key={i} m={md} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="px-8 py-10">
      <div className="text-center">
        <div className="relative inline-flex">
          <span className="pointer-events-none absolute -inset-6 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,106,31,0.35),transparent_65%)] blur-xl" />
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-b from-[#ff7a35] to-[#ff5a0f] flex items-center justify-center shadow-[0_12px_30px_-8px_rgba(255,106,31,0.6),inset_0_1px_0_0_rgba(255,255,255,0.25)]">
            <Sparkles className="h-6 w-6 text-white" strokeWidth={2.25} />
          </div>
        </div>
        <h2 className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-white">
          How can I help with your{" "}
          <span className="bg-gradient-to-r from-[#ff8a4a] via-[#ff6a1f] to-[#ff5a0f] bg-clip-text text-transparent">data trust</span>
          ?
        </h2>
        <p className="mt-2 text-[13.5px] text-[#9a9aa3]">
          Ask about a dataset, owner, lineage edge, or trust event. I'll cite the source.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestionGroups.map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.title} className="rounded-xl border border-[#1f1f24] bg-gradient-to-b from-[#0e0e12] to-[#0a0a0d] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-[rgba(255,106,31,0.10)] ring-1 ring-[rgba(255,106,31,0.20)] flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-[#ff8a4a]" />
                </div>
                <span className="text-[12.5px] font-semibold text-white">{g.title}</span>
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {g.items.map((s) => (
                  <button
                    key={s}
                    onClick={() => onPick(s)}
                    className="group text-left px-3 py-2 rounded-lg text-[12.5px] text-[#c8c8d0] hover:text-white hover:bg-[#101014] transition-colors flex items-center justify-between gap-2"
                  >
                    <span>{s}</span>
                    <ArrowUpRight className="h-3 w-3 text-[#5a5a63] group-hover:text-[#ff8a4a] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const recentThreads = [
  { title: "Trust drop on marketing_attribution", time: "2 min ago", active: true },
  { title: "At-risk datasets this quarter", time: "1 hr ago" },
  { title: "Lineage for revenue_daily", time: "Yesterday" },
  { title: "Schema audit — finance domain", time: "Apr 18" },
];

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>(seedConversation);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      {
        role: "assistant",
        text:
          "Here's what I found across your warehouses. I scanned active pipelines, recent trust deltas, and ownership records for the most relevant context.",
        metadata: [
          { kind: "stat", label: "Datasets reviewed", value: "8", delta: "across 4 sources" },
          { kind: "stat", label: "Avg trust", value: "74", delta: "+3.2 vs last week" },
          { kind: "lineage", from: "stripe_raw", to: "finance_ledger", health: "healthy" },
        ],
      },
    ]);
    setInput("");
  };

  const reset = () => setMessages([]);

  return (
    <>
      <PageHeader
        eyebrow="Trust Copilot"
        title="AI"
        highlight="Assistant"
        description="Ask anything about your warehouses, lineage, ownership, or trust changes."
        actions={
          <>
            <GhostButton icon={MessageSquare}>History</GhostButton>
            <EmberButton icon={Wand2}>New thread</EmberButton>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
        <div className="lg:sticky lg:top-24 space-y-4">
          <Card className="p-4">
            <button
              onClick={reset}
              className="w-full h-10 px-3 rounded-lg bg-gradient-to-b from-[#ff7a35] to-[#ff5a0f] hover:from-[#ff8a4a] hover:to-[#ff6a1f] text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-[0_10px_24px_-6px_rgba(255,106,31,0.55),0_0_0_1px_rgba(255,138,74,0.4)_inset,0_1px_0_0_rgba(255,255,255,0.25)_inset]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.75} /> New conversation
            </button>
            <div className="mt-5 px-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#5a5a63]">Recent</div>
            <div className="mt-2 flex flex-col gap-1">
              {recentThreads.map((t) => (
                <button
                  key={t.title}
                  className={[
                    "group relative text-left px-3 py-2.5 rounded-lg transition-colors overflow-hidden",
                    t.active ? "bg-[#101014] border border-[#2a1f18]" : "hover:bg-[#101014] border border-transparent",
                  ].join(" ")}
                >
                  {t.active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-[#ff6a1f] shadow-[0_0_10px_rgba(255,106,31,0.7)]" />}
                  <div className="flex items-center gap-2 text-[12.5px] font-medium text-white truncate">
                    <MessageSquare className="h-3.5 w-3.5 text-[#8a8a93] shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </div>
                  <div className="mt-0.5 ml-5 flex items-center gap-1 text-[10.5px] text-[#5a5a63]">
                    <Clock className="h-2.5 w-2.5" /> {t.time}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <Card className="flex flex-col min-h-[640px]">
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <EmptyState onPick={(q) => setInput(q)} />
            ) : (
              <div className="px-6 py-6 space-y-5">
                {messages.map((m, i) => <MessageBubble key={i} m={m} />)}
              </div>
            )}
          </div>

          <div className="border-t border-[#16161a] p-4">
            <div className="relative">
              <span className="pointer-events-none absolute -inset-1 rounded-2xl bg-[radial-gradient(circle_at_left,rgba(255,106,31,0.18),transparent_60%)] blur-xl" />
              <div className="relative flex items-end gap-2 rounded-xl bg-[#0d0d10] border border-[#1f1f24] focus-within:border-[#2a2a30] transition-colors p-2 pl-3.5">
                <Sparkles className="h-4 w-4 mt-2 text-[#ff8a4a]" />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  placeholder="Ask about a dataset, owner, or pipeline..."
                  className="flex-1 bg-transparent resize-none text-[13.5px] placeholder:text-[#5a5a63] text-white focus:outline-none py-2 max-h-32"
                />
                <button className="h-9 w-9 rounded-lg flex items-center justify-center text-[#8a8a93] hover:text-white hover:bg-[#101014] transition-colors">
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  onClick={() => send(input)}
                  className="h-9 w-9 rounded-lg bg-gradient-to-b from-[#ff7a35] to-[#ff5a0f] flex items-center justify-center text-white shadow-[0_6px_18px_-4px_rgba(255,106,31,0.6),0_0_0_1px_rgba(255,138,74,0.4)_inset]"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 px-1 text-[10.5px] text-[#5a5a63] flex items-center justify-between">
                <span>Press Enter to send · Shift + Enter for newline</span>
                <span>TrustLayer Copilot · GPT-grade reasoning</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
