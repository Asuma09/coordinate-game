import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { BottomNav } from "@/components/bottom-nav";
import { LogoutIcon } from "@/components/icons";
import {
  computeStreak,
  getNextTitle,
  getTitle,
  TITLE_THRESHOLDS,
} from "@/lib/profile-stats";
import { NicknameForm } from "./nickname-form";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/60 bg-white/80 py-3 shadow-sm shadow-purple-100">
      <span className="text-lg font-bold text-gray-800">{value}</span>
      <span className="text-[11px] text-gray-500">{label}</span>
    </div>
  );
}

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: outfits } = await supabase
    .from("outfits")
    .select("score_total, created_at")
    .eq("user_id", user.id);

  const scoredOutfits = (outfits ?? []).filter(
    (outfit): outfit is { score_total: number; created_at: string } =>
      outfit.score_total != null,
  );

  const totalCount = outfits?.length ?? 0;
  const averageScore =
    scoredOutfits.length > 0
      ? Math.round(
          scoredOutfits.reduce((sum, outfit) => sum + outfit.score_total, 0) /
            scoredOutfits.length,
        )
      : null;
  const bestScore =
    scoredOutfits.length > 0
      ? Math.max(...scoredOutfits.map((outfit) => outfit.score_total))
      : null;

  const streak = computeStreak((outfits ?? []).map((outfit) => outfit.created_at));
  const title = getTitle(bestScore);
  const nextTitle = getNextTitle(bestScore);

  const nickname =
    typeof user.user_metadata?.nickname === "string"
      ? user.user_metadata.nickname
      : "";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-10 pb-24">
      <h1 className="text-2xl font-bold text-gray-800">マイページ</h1>

      <NicknameForm initialNickname={nickname} />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="投稿数" value={`${totalCount}件`} />
        <StatCard
          label="平均点"
          value={averageScore != null ? `${averageScore}点` : "-"}
        />
        <StatCard
          label="最高点"
          value={bestScore != null ? `${bestScore}点` : "-"}
        />
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-md shadow-purple-100 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-gradient-to-r from-amber-200 to-orange-200 px-3 py-1 text-sm font-semibold text-amber-700">
            {title}
          </span>
          {streak > 0 && (
            <span className="text-sm font-semibold text-indigo-600">
              🔥 {streak}日連続
            </span>
          )}
        </div>

        {nextTitle ? (
          <p className="mt-2 text-xs text-gray-500">
            次の称号「{nextTitle.label}」まであと{nextTitle.pointsNeeded}点
          </p>
        ) : (
          <p className="mt-2 text-xs text-gray-500">
            最高称号に到達しました！
          </p>
        )}

        <ul className="mt-3 flex flex-col gap-1 border-t border-purple-50 pt-3">
          {TITLE_THRESHOLDS.map((threshold) => {
            const achieved = (bestScore ?? 0) >= threshold.min;
            return (
              <li
                key={threshold.label}
                className={`flex items-center justify-between text-xs ${
                  achieved ? "font-semibold text-gray-700" : "text-gray-300"
                }`}
              >
                <span>{threshold.label}</span>
                <span>{threshold.min}点〜</span>
              </li>
            );
          })}
        </ul>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-100"
        >
          <LogoutIcon className="h-4 w-4" />
          ログアウト
        </button>
      </form>

      <BottomNav />
    </main>
  );
}
