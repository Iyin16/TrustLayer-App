function trustColor(score: number) {
  if (score >= 85) return "text-[#34d399]";
  if (score >= 65) return "text-[#ff6a1f]";
  return "text-[#f87171]";
}

export function TrustRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = trustColor(score);
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const glow =
    score >= 85 ? "rgba(52,211,153,0.55)" : score >= 65 ? "rgba(255,106,31,0.65)" : "rgba(248,113,113,0.55)";
  return (
    <div className="relative" style={{ height: size, width: size }}>
      <span
        className="pointer-events-none absolute inset-0 rounded-full blur-md opacity-70"
        style={{ background: `radial-gradient(circle, ${glow}, transparent 65%)` }}
      />
      <svg className="relative -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1f1f24" strokeWidth="3" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          className={c}
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
        />
      </svg>
      <div className={["absolute inset-0 flex items-center justify-center font-semibold tracking-tight", c].join(" ")} style={{ fontSize: size * 0.26 }}>
        {score}
      </div>
    </div>
  );
}
