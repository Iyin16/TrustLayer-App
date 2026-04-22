export function TrustRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const isLow = score < 50;
  const color = isLow ? "#f87171" : "#ff4d2e";
  const glow = isLow ? "rgba(248,113,113,0.55)" : "rgba(255,77,46,0.65)";
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
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-semibold tracking-tight"
        style={{ fontSize: size * 0.26, color }}
      >
        {score}
      </div>
    </div>
  );
}
