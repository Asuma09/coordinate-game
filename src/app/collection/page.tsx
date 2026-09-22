import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">コレクション</h1>
          {nickname && (
            <p className="mt-1 text-sm text-gray-500">{nickname} さん</p>
          )}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            ログアウト
          </button>
        </form>
      </div>

      <Link
        href="/outfits/new"
        className="rounded-md bg-black px-3 py-2 text-center text-white"
      >
        コーデを撮影する
      </Link>

      {outfits && outfits.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {outfits.map((outfit) => (
            <div key={outfit.id} className="flex flex-col gap-1">
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
                <Image
                  src={outfit.illustration_url ?? outfit.photo_url}
                  alt="撮影したコーデ"
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
                {!outfit.illustration_url && (
                  <p className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
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
        <p className="text-sm text-gray-500">
          まだコーデが登録されていません。カメラでコーデを撮影しましょう。
        </p>
      )}
    </main>
  );
}
