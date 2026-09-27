"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NicknameForm({ initialNickname }: { initialNickname: string }) {
  const [nickname, setNickname] = useState(initialNickname);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function handleSave() {
    setStatus("saving");
    const supabase = createClient();
    const trimmed = nickname.trim();
    const { error } = await supabase.auth.updateUser({
      data: { nickname: trimmed },
    });
    setStatus(error ? "error" : "saved");
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-md shadow-purple-100 backdrop-blur-md">
      <label htmlFor="account-nickname" className="text-sm text-gray-600">
        アカウントのニックネーム（撮影時の表示名の初期値になります）
      </label>
      <div className="flex gap-2">
        <input
          id="account-nickname"
          type="text"
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value);
            setStatus("idle");
          }}
          maxLength={20}
          placeholder="例: あすま"
          className="flex-1 rounded-2xl border border-purple-100 bg-white/70 px-4 py-2.5 text-sm focus:border-purple-300 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className="shrink-0 rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-orange-300 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-pink-200 disabled:opacity-50"
        >
          {status === "saving" ? "保存中..." : "保存"}
        </button>
      </div>
      {status === "saved" && (
        <p className="text-xs text-emerald-600">保存しました</p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-600">保存に失敗しました</p>
      )}
    </div>
  );
}
