import type { DayPoint, MonthPoint } from "@/modules/reports/dashboard";

const OTHER_COLOR = "var(--chart-2)";
const DONE_COLOR = "var(--success)";

export function BarChart({ data }: { data: DayPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.completed + d.other));

  return (
    <div className="flex items-end gap-2">
      {data.map((d) => {
        const total = d.completed + d.other;
        const height = total > 0 ? Math.max(6, (total / max) * 100) : 3;
        const completedPct = total > 0 ? (d.completed / total) * 100 : 0;
        const otherPct = 100 - completedPct;
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end justify-center">
              <div
                className="flex w-full max-w-10 flex-col overflow-hidden rounded-md"
                style={{ height: `${height}%` }}
              >
                <div style={{ height: `${otherPct}%`, backgroundColor: OTHER_COLOR }} />
                <div style={{ height: `${completedPct}%`, backgroundColor: DONE_COLOR }} />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function LineChart({ data }: { data: MonthPoint[] }) {
  const max = Math.max(
    1,
    ...data.flatMap((d) => [d.revenueCents, d.expenseCents]),
  );
  const n = data.length;
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * 300);
  const y = (value: number) => 110 - (value / max) * 100;
  const points = (key: "revenueCents" | "expenseCents") =>
    data.map((d, i) => `${x(i)},${y(d[key])}`).join(" ");

  return (
    <div className="space-y-2">
      <svg
        viewBox="0 0 300 120"
        className="h-36 w-full"
        preserveAspectRatio="none"
      >
        <polyline
          points={points("revenueCents")}
          fill="none"
          style={{ stroke: "var(--chart-3)" }}
          strokeWidth={3}
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={points("expenseCents")}
          fill="none"
          style={{ stroke: "var(--warning)" }}
          strokeWidth={2}
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  const segments = data.reduce<
    { label: string; value: number; color: string; length: number; offset: number }[]
  >((acc, d) => {
    const length = (d.value / total) * circumference;
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].length : 0;
    acc.push({ ...d, length, offset });
    return acc;
  }, []);

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="size-28 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--muted)" strokeWidth="12" />
        {segments.map((s) => (
          <circle
            key={s.label}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth="12"
            strokeDasharray={`${s.length} ${circumference - s.length}`}
            strokeDashoffset={-s.offset}
          />
        ))}
      </svg>
      <ul className="space-y-1 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-medium">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
