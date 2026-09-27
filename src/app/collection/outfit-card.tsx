"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { deleteOutfit } from "@/app/actions/outfit";
import { ScoreBreakdownBars, type ScoreBreakdown } from "@/components/score-breakdown";
import { TrashIcon } from "@/components/icons";

type Outfit = {
  id: string;
  photo_url: string;
  illustration_url: string | null;
  score_total: number | null;
  comment: string | null;
  score_breakdown: ScoreBreakdown;
};

export function OutfitCard({ outfit }: { outfit: Outfit }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteOutfit(outfit.id);
    });
  }

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-3xl border border-white/60 bg-white/80 p-2.5 shadow-md shadow-purple-100 backdrop-blur-md transition ${
        isPending ? "opacity-40" : ""
      }`}
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

        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={isPending}
          aria-label="削除する"
          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm disabled:opacity-50"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>

        {confirming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 px-3 text-center">
            <p className="text-xs font-semibold text-white">削除しますか？</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-gray-700"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full bg-gradient-to-r from-rose-500 to-red-500 px-3 py-1 text-[11px] font-semibold text-white"
              >
                削除する
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs font-semibold text-gray-700">
        {outfit.score_total != null ? `スコア: ${outfit.score_total}点` : "未採点"}
      </p>

      <ScoreBreakdownBars breakdown={outfit.score_breakdown} />

      {outfit.comment && (
        <p className="whitespace-pre-line text-xs text-gray-500">
          {outfit.comment}
        </p>
      )}
    </div>
  );
}
