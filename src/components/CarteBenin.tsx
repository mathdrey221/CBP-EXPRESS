import { VILLE_POS, VILLES, type Ville } from "@/lib/cbp";

export function CarteBenin({ data }: { data: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(data));
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <svg viewBox="0 0 100 160" className="h-64 w-auto shrink-0" role="img" aria-label="Carte du Bénin">
        <path
          d="M38 6 L66 10 L70 26 L62 40 L66 56 L60 74 L58 96 L50 108 L46 124 L52 138 L62 146 L52 152 L40 146 L38 128 L42 110 L36 96 L34 74 L28 56 L32 34 L30 18 Z"
          className="fill-primary/10 stroke-primary/40"
          strokeWidth="1.2"
        />
        {VILLES.map((v) => {
          const pos = VILLE_POS[v as Ville];
          const n = data[v] ?? 0;
          const r = 3.5 + (n / max) * 6;
          return (
            <g key={v}>
              <circle cx={pos.x} cy={pos.y} r={r + 4} className="fill-accent/20" />
              <circle cx={pos.x} cy={pos.y} r={r} className="fill-accent" />
              <text x={pos.x + 9} y={pos.y + 1} className="fill-foreground text-[5px] font-semibold">
                {v}
              </text>
              <text x={pos.x + 9} y={pos.y + 7} className="fill-muted-foreground text-[4.5px]">
                {n} colis
              </text>
            </g>
          );
        })}
      </svg>
      <div className="grid flex-1 gap-3">
        {VILLES.map((v) => (
          <div key={v} className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">{v}</span>
              <span className="text-2xl font-bold text-primary">{data[v] ?? 0}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-gradient-accent" style={{ width: `${((data[v] ?? 0) / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
