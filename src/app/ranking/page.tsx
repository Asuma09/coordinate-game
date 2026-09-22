import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ランキング</h1>
        <Link
          href="/collection"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          コレクションへ
        </Link>
      </div>

      {outfits && outfits.length > 0 ? (
        <RankingList outfits={outfits} />
      ) : (
        <p className="text-sm text-gray-500">
          まだ採点されたコーデがありません。
        </p>
      )}
    </main>
  );
}
