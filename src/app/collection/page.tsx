import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { BottomNav } from "@/components/bottom-nav";
import { CameraIcon, CrownIcon, LogoutIcon } from "@/components/icons";

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
    .select("id, photo_url, illustration_url, score_total, comment")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const nickname =
    typeof user.user_metadata?.nickname === "string"
      ? user.user_metadata.nickname
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">コレクション</h1>
          {nickname && (
            <p className="mt-1 text-sm text-gray-500">{nickname} さん</p>
          )}
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
            <div
              key={outfit.id}
              className="flex flex-col gap-1.5 rounded-3xl border border-white/60 bg-white/80 p-2.5 shadow-md shadow-purple-100 backdrop-blur-md"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-sky-50">
                <Image
                  src={outfit.illustration_url ?? outfit.photo_url}
                  alt="撮影したコーデ"
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
                {!outfit.illustration_url && (
                  <p className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    イラスト生成中...
                  </p>
                )}
              </div>
              <p className="text-xs font-semibold text-gray-700">
                {outfit.score_total != null
                  ? `スコア: ${outfit.score_total}点`
                  : "未採点"}
              </p>
              {outfit.comment && (
                <p className="text-xs text-gray-500">{outfit.comment}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-3xl border border-white/60 bg-white/80 p-6 text-center text-sm text-gray-500 shadow-md shadow-purple-100 backdrop-blur-md">
          まだコーデが登録されていません。カメラでコーデを撮影しましょう。
        </p>
      )}
      <BottomNav />
    </main>
  );
}
