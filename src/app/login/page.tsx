"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleGuestLogin() {
    setStatus("loading");

    const supabase = createClient();
    const trimmedNickname = nickname.trim();
    const { error } = await supabase.auth.signInAnonymously({
      options: {
        data: trimmedNickname ? { nickname: trimmedNickname } : {},
      },
    });

    if (error) {
      setStatus("error");
      return;
    }

    window.location.href = "/collection";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div className="flex flex-col gap-6 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-purple-100 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            コーデ採点ログイン
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            メール登録不要。ボタン一つでゲストとして始められます。
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nickname" className="text-sm text-gray-700">
            ニックネーム（任意）
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={20}
            placeholder="例: あすま"
            className="rounded-2xl border border-purple-100 bg-white/70 px-4 py-2.5 text-sm focus:border-purple-300 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={status === "loading"}
          className="rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-orange-300 px-4 py-3 font-semibold text-white shadow-lg shadow-pink-200 transition hover:brightness-105 disabled:opacity-50"
        >
          {status === "loading" ? "ログイン中..." : "ゲストとして始める"}
        </button>

        {status === "error" && (
          <p className="text-sm text-red-600">
            ログインに失敗しました。もう一度お試しください。
          </p>
        )}
      </div>
    </main>
  );
}
