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
      <h1 className="text-3xl font-bold">コーデ採点コレクション</h1>
      <p className="max-w-md text-gray-500">
        コーデをカメラで1枚撮影するだけ。AIが配色やバランス、似合っているかを採点し、イラスト化して自分だけのコレクションに保存しよう。
      </p>
      <Link
        href="/login"
        className="rounded-md bg-black px-5 py-2.5 text-white"
      >
        はじめる
      </Link>
    </main>
  );
}
