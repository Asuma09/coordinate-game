import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";
import { RankingList } from "./ranking-list";

export default async function RankingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: outfits } = await supabase
    .from("outfits")
    .select("id, nickname, score_total, photo_url, illustration_url")
    .not("score_total", "is", null)
    .order("score_total", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10 pb-24">
      <h1 className="text-2xl font-bold text-gray-800">ランキング</h1>

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
