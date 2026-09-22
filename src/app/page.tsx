import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/collection");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-lg shadow-purple-100 backdrop-blur-md">
        <h1 className="text-3xl font-bold text-gray-800">
          コーデ採点コレクション
        </h1>
        <p className="max-w-md text-gray-500">
          コーデをカメラで1枚撮影するだけ。AIが配色やバランス、似合っているかを採点し、イラスト化して自分だけのコレクションに保存しよう。
        </p>
        <Link
          href="/login"
          className="rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-orange-300 px-8 py-3 font-semibold text-white shadow-lg shadow-pink-200 transition hover:brightness-105"
        >
          はじめる
        </Link>
      </div>
    </main>
  );
}
