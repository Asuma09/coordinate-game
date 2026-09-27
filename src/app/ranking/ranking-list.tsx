"use client";

import Image from "next/image";
import { useState } from "react";
import { ScoreBreakdownBars, type ScoreBreakdown } from "@/components/score-breakdown";

type RankingOutfit = {
  id: string;
  user_id: string;
  nickname: string | null;
  score_total: number | null;
  photo_url: string;
  illustration_url: string | null;
  score_breakdown: ScoreBreakdown;
  comment: string | null;
};

const RANK_BADGE = [
  "bg-gradient-to-br from-yellow-300 to-amber-400 text-white",
  "bg-gradient-to-br from-gray-300 to-slate-400 text-white",
  "bg-gradient-to-br from-orange-300 to-amber-500 text-white",
];

export function RankingList({
  outfits,
  currentUserId,
}: {
  outfits: RankingOutfit[];
  currentUserId: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="flex flex-col gap-2.5">
      {outfits.map((outfit, index) => {
        const isOpen = openId === outfit.id;
        const isOwn = outfit.user_id === currentUserId;
        const badgeClass = RANK_BADGE[index] ?? "bg-purple-100 text-purple-500";
        return (
          <li
            key={outfit.id}
            className={`overflow-hidden rounded-3xl border bg-white/80 shadow-md shadow-purple-100 backdrop-blur-md ${
              isOwn ? "border-pink-300 ring-2 ring-pink-200" : "border-white/60"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : outfit.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badgeClass}`}
              >
                {index + 1}
              </span>
              <span className="flex flex-1 items-center gap-1.5 truncate text-sm font-semibold text-gray-700">
                <span className="truncate">{outfit.nickname ?? "ゲスト"}</span>
                {isOwn && (
                  <span className="shrink-0 rounded-full bg-pink-400 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    あなた
                  </span>
                )}
              </span>
              <span className="shrink-0 text-sm font-bold text-pink-500">
                {outfit.score_total}点
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-white/60">
                <div className="relative aspect-square w-full bg-sky-50">
                  <Image
                    src={outfit.illustration_url ?? outfit.photo_url}
                    alt={`${outfit.nickname ?? "ゲスト"}のコーデ`}
                    fill
                    sizes="(min-width: 640px) 512px, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-2 px-4 py-3">
                  <ScoreBreakdownBars breakdown={outfit.score_breakdown} />
                  {outfit.comment && (
                    <p className="whitespace-pre-line text-xs text-gray-500">
                      {outfit.comment}
                    </p>
                  )}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
