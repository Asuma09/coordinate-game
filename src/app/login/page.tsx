"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleGuestLogin() {
    setStatus("loading");

    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      setStatus("error");
      return;
    }

    window.location.href = "/collection";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-bold">コーデ採点ログイン</h1>
        <p className="mt-2 text-sm text-gray-500">
          メール登録不要。ボタン一つでゲストとして始められます。
        </p>
      </div>

      <button
        type="button"
        onClick={handleGuestLogin}
        disabled={status === "loading"}
        className="rounded-md bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {status === "loading" ? "ログイン中..." : "ゲストとして始める"}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-600">
          ログインに失敗しました。もう一度お試しください。
        </p>
      )}
    </main>
  );
}
