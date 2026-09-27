import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { BottomNav } from "@/components/bottom-nav";
import { CameraIcon, CrownIcon, LogoutIcon } from "@/components/icons";
import { OutfitCard } from "./outfit-card";
import { AutoRefresh } from "./auto-refresh";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// JST基準の日付キー(YYYY-MM-DD)に変換する。
function toJstDateKey(iso: string): string {
  return new Date(new Date(iso).getTime() + JST_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

// 投稿日時の一覧から「今日 or 昨日」を起点にした連続投稿日数を数える。
function computeStreak(createdAts: string[]): number {
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

function getTitle(maxScore: number | null): string {
  if (maxScore == null) return "ビギナー";
  if (maxScore >= 90) return "殿堂入りスタイリスト";
  if (maxScore >= 80) return "ファッション上級者";
  if (maxScore >= 70) return "コーデ達人";
  if (maxScore >= 50) return "おしゃれ見習い";
  return "ビギナー";
}

export default async function CollectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: outfits } = await supabase
    .from("outfits")
    .select(
      "id, photo_url, illustration_url, score_total, comment, score_breakdown, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const nickname =
    typeof user.user_metadata?.nickname === "string"
      ? user.user_metadata.nickname
      : null;

  const streak = computeStreak((outfits ?? []).map((outfit) => outfit.created_at));
  const maxScore =
    outfits && outfits.length > 0
      ? outfits.reduce<number | null>((max, outfit) => {
          if (outfit.score_total == null) return max;
          return max == null ? outfit.score_total : Math.max(max, outfit.score_total);
        }, null)
      : null;
  const title = getTitle(maxScore);
  const hasPendingIllustration = (outfits ?? []).some(
    (outfit) => outfit.score_total != null && !outfit.illustration_url,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">コレクション</h1>
          {nickname && (
            <p className="mt-1 text-sm text-gray-500">{nickname} さん</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-gradient-to-r from-amber-200 to-orange-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {title}
            </span>
            {streak > 0 && (
              <span className="rounded-full bg-gradient-to-r from-sky-200 to-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                🔥 {streak}日連続
              </span>
            )}
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-100"
          >
            <LogoutIcon className="h-4 w-4" />
            ログアウト
          </button>
        </form>
      </div>

      <div className="flex gap-3">
        <Link
          href="/outfits/new"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-orange-300 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-pink-200"
        >
          <CameraIcon className="h-4 w-4" />
          コーデを撮影する
        </Link>
        <Link
          href="/ranking"
          className="flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100"
        >
          <CrownIcon className="h-4 w-4" />
          ランキング
        </Link>
      </div>

      {outfits && outfits.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {outfits.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} />
          ))}
        </div>
      ) : (
        <p className="rounded-3xl border border-white/60 bg-white/80 p-6 text-center text-sm text-gray-500 shadow-md shadow-purple-100 backdrop-blur-md">
          まだコーデが登録されていません。カメラでコーデを撮影しましょう。
        </p>
      )}
      <AutoRefresh enabled={hasPendingIllustration} />
      <BottomNav />
    </main>
  );
}
