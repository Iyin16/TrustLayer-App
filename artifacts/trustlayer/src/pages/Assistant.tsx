import { Sparkles, Send, MessageSquare, Bot, User, Wand2 } from "lucide-react";
import { PageHeader, EmberButton, GhostButton, Card } from "../components/Layout";

type Message = { role: "user" | "assistant"; text: string };

const conversation: Message[] = [
  { role: "user", text: "Why did the trust score for marketing_attribution drop this week?" },
  {
    role: "assistant",
    text:
      "marketing_attribution dropped 8 points (from 79 → 71) on Apr 19. Two upstream changes correlate: a schema change in hubspot_export removed the campaign_id column, and a 4-hour ingestion lag on Apr 18. I recommend reviewing the dbt model attribution_join.sql with Diego Alvarez.",
  },
  { role: "user", text: "Which datasets are most at risk this quarter?" },
  {
    role: "assistant",
    text:
      "Two datasets are flagged At Risk: legacy_invoices (trust 41) and inventory_snapshot (trust 52). Both have stale freshness signatures and unresolved owner alerts. Want me to draft a remediation plan?",
  },
];

const suggestions = [
  "Summarize this week's trust changes",
  "Find datasets with stale schemas",
  "Explain the lineage for revenue_daily",
  "Draft an incident report for legacy_invoices",
];

export default function Assistant() {
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <Card className="flex flex-col min-h-[560px]">
          <div className="flex-1 px-6 py-6 space-y-5 overflow-y-auto">
            {conversation.map((m, i) => (
              <div key={i} className={["flex gap-3", m.role === "user" ? "justify-end" : ""].join(" ")}>
                {m.role === "assistant" && (
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-[rgba(255,106,31,0.10)] ring-1 ring-[rgba(255,106,31,0.25)] flex items-center justify-center">
                    <Bot className="h-4 w-4 text-[#ff8a4a]" />
                  </div>
                )}
                <div
                  className={[
                    "max-w-[78%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed",
                    m.role === "user"
                      ? "bg-gradient-to-b from-[#ff7a35] to-[#ff5a0f] text-white shadow-[0_8px_24px_-10px_rgba(255,106,31,0.6)]"
                      : "bg-[#101014] border border-[#1f1f24] text-[#e0e0e7]",
                  ].join(" ")}
                >
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-[#1f1f24] flex items-center justify-center">
                    <User className="h-4 w-4 text-[#a8a8b3]" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[#16161a] p-4">
            <div className="relative">
              <Sparkles className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ff8a4a]" />
              <input
                type="text"
                placeholder="Ask about a dataset, owner, or pipeline..."
                className="w-full h-12 pl-10 pr-14 rounded-xl bg-[#0d0d10] border border-[#1f1f24] text-[13.5px] placeholder:text-[#5a5a63] text-white focus:outline-none focus:border-[#2a2a30] transition-colors"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-gradient-to-b from-[#ff7a35] to-[#ff5a0f] flex items-center justify-center text-white shadow-[0_6px_18px_-4px_rgba(255,106,31,0.6)]">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
            <Sparkles className="h-4 w-4 text-[#ff8a4a]" />
            Suggested prompts
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                className="text-left px-3.5 py-3 rounded-lg border border-[#1f1f24] bg-[#0d0d10] hover:bg-[#16161a] hover:border-[#2a2a30] text-[12.5px] text-[#d8d8de] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
