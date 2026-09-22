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
    .select("id, photo_url, score_total, comment")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">コレクション</h1>
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
                  src={outfit.photo_url}
                  alt="撮影したコーデ"
                  fill
                  className="object-cover"
                />
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
