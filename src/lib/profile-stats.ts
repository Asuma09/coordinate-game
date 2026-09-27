const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// JST基準の日付キー(YYYY-MM-DD)に変換する。
export function toJstDateKey(iso: string): string {
  return new Date(new Date(iso).getTime() + JST_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

// 投稿日時の一覧から「今日 or 昨日」を起点にした連続投稿日数を数える。
export function computeStreak(createdAts: string[]): number {
  if (createdAts.length === 0) return 0;

  const oneDayMs = 24 * 60 * 60 * 1000;
  const dayKeys = Array.from(new Set(createdAts.map(toJstDateKey))).sort(
    (a, b) => (a < b ? 1 : -1),
  );

  const todayKey = toJstDateKey(new Date().toISOString());
  let cursor = new Date(`${todayKey}T00:00:00Z`).getTime();
  if (dayKeys[0] !== todayKey) {
    cursor -= oneDayMs;
  }

  let streak = 0;
  for (const dayKey of dayKeys) {
    const dayTime = new Date(`${dayKey}T00:00:00Z`).getTime();
    if (dayTime === cursor) {
      streak += 1;
      cursor -= oneDayMs;
    } else if (dayTime < cursor) {
      break;
    }
  }

  return streak;
}

export type TitleThreshold = { min: number; label: string };

// 最高スコアに応じた称号の一覧（点数の昇順）。
export const TITLE_THRESHOLDS: TitleThreshold[] = [
  { min: 0, label: "ビギナー" },
  { min: 50, label: "おしゃれ見習い" },
  { min: 70, label: "コーデ達人" },
  { min: 80, label: "ファッション上級者" },
  { min: 90, label: "殿堂入りスタイリスト" },
];

export function getTitle(maxScore: number | null): string {
  const score = maxScore ?? 0;
  let current = TITLE_THRESHOLDS[0].label;
  for (const threshold of TITLE_THRESHOLDS) {
    if (score >= threshold.min) {
      current = threshold.label;
    }
  }
  return current;
}

export function getNextTitle(
  maxScore: number | null,
): { label: string; pointsNeeded: number } | null {
  const score = maxScore ?? 0;
  const next = TITLE_THRESHOLDS.find((threshold) => threshold.min > score);
  if (!next) return null;
  return { label: next.label, pointsNeeded: next.min - score };
}
