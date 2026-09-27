import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";
import { RankingList } from "./ranking-list";

type Period = "today" | "week" | "all";

const PERIOD_TABS: { value: Period; label: string }[] = [
  { value: "today", label: "今日" },
  { value: "week", label: "今週" },
  { value: "all", label: "全期間" },
];

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// JST基準で「今日」「今週(月曜始まり)」の開始時刻をUTCのISO文字列で返す。全期間ならnull。
function getPeriodCutoffISO(period: Period): string | null {
  if (period === "all") return null;

  const jstNow = new Date(Date.now() + JST_OFFSET_MS);

  if (period === "today") {
    jstNow.setUTCHours(0, 0, 0, 0);
    return new Date(jstNow.getTime() - JST_OFFSET_MS).toISOString();
  }

  const dayOfWeek = jstNow.getUTCDay(); // 0:日 1:月 ... 6:土
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  jstNow.setUTCDate(jstNow.getUTCDate() - daysSinceMonday);
  jstNow.setUTCHours(0, 0, 0, 0);
  return new Date(jstNow.getTime() - JST_OFFSET_MS).toISOString();
}

export default async function RankingPage(props: PageProps<"/ranking">) {
  const searchParams = await props.searchParams;
  const rawPeriod = Array.isArray(searchParams.period)
    ? searchParams.period[0]
    : searchParams.period;
  const period: Period =
    rawPeriod === "today" || rawPeriod === "all" ? rawPeriod : "week";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let query = supabase
    .from("outfits")
    .select(
      "id, nickname, score_total, photo_url, illustration_url, score_breakdown",
    )
    .not("score_total", "is", null)
    .order("score_total", { ascending: false })
    .limit(100);

  const cutoff = getPeriodCutoffISO(period);
  if (cutoff) {
    query = query.gte("created_at", cutoff);
  }

  const { data: outfits } = await query;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10 pb-24">
      <h1 className="text-2xl font-bold text-gray-800">ランキング</h1>

      <div className="flex gap-2">
        {PERIOD_TABS.map((tab) => {
          const isActive = tab.value === period;
          const href =
            tab.value === "week" ? "/ranking" : `/ranking?period=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={`flex-1 rounded-full px-3 py-2 text-center text-sm font-semibold shadow-sm transition ${
                isActive
                  ? "bg-gradient-to-r from-sky-400 to-indigo-400 text-white shadow-md shadow-indigo-100"
                  : "border border-purple-100 bg-white/80 text-gray-500"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {outfits && outfits.length > 0 ? (
        <RankingList outfits={outfits} />
      ) : (
        <p className="rounded-3xl border border-white/60 bg-white/80 p-6 text-center text-sm text-gray-500 shadow-md shadow-purple-100 backdrop-blur-md">
          まだ採点されたコーデがありません。
        </p>
      )}
      <BottomNav />
    </main>
  );
}
