export type ScoreBreakdown = {
  color?: number;
  balance?: number;
  suitability?: number;
} | null;

const AXES: {
  key: "color" | "balance" | "suitability";
  label: string;
  max: number;
  barClassName: string;
}[] = [
  {
    key: "color",
    label: "配色",
    max: 30,
    barClassName: "bg-gradient-to-r from-pink-400 to-rose-400",
  },
  {
    key: "balance",
    label: "バランス",
    max: 30,
    barClassName: "bg-gradient-to-r from-sky-400 to-indigo-400",
  },
  {
    key: "suitability",
    label: "調和度",
    max: 40,
    barClassName: "bg-gradient-to-r from-purple-400 to-fuchsia-400",
  },
];

export function ScoreBreakdownBars({
  breakdown,
}: {
  breakdown: ScoreBreakdown;
}) {
  if (!breakdown) return null;

  const hasAnyValue = AXES.some(
    ({ key }) => typeof breakdown[key] === "number",
  );
  if (!hasAnyValue) return null;

  return (
    <div className="flex flex-col gap-1">
      {AXES.map(({ key, label, max, barClassName }) => {
        const value = breakdown[key];
        if (typeof value !== "number") return null;
        const percent = Math.min(100, Math.max(0, (value / max) * 100));

        return (
          <div key={key} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[10px] text-gray-500">
              {label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${barClassName}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-[10px] font-semibold text-gray-600">
              {value}/{max}
            </span>
          </div>
        );
      })}
    </div>
  );
}
