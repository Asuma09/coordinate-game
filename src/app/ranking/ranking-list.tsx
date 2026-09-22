"use client";

import Image from "next/image";
import { useState } from "react";

type RankingOutfit = {
  id: string;
  nickname: string | null;
  score_total: number | null;
  photo_url: string;
  illustration_url: string | null;
};

const RANK_BADGE = [
  "bg-gradient-to-br from-yellow-300 to-amber-400 text-white",
  "bg-gradient-to-br from-gray-300 to-slate-400 text-white",
  "bg-gradient-to-br from-orange-300 to-amber-500 text-white",
];

export function RankingList({ outfits }: { outfits: RankingOutfit[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="flex flex-col gap-2.5">
      {outfits.map((outfit, index) => {
        const isOpen = openId === outfit.id;
        const badgeClass = RANK_BADGE[index] ?? "bg-purple-100 text-purple-500";
        return (
          <li
            key={outfit.id}
            className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-md shadow-purple-100 backdrop-blur-md"
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
              <span className="flex-1 truncate text-sm font-semibold text-gray-700">
                {outfit.nickname ?? "ゲスト"}
              </span>
              <span className="shrink-0 text-sm font-bold text-pink-500">
                {outfit.score_total}点
              </span>
            </button>

            {isOpen && (
              <div className="relative aspect-square w-full border-t border-white/60 bg-sky-50">
                <Image
                  src={outfit.illustration_url ?? outfit.photo_url}
                  alt={`${outfit.nickname ?? "ゲスト"}のコーデ`}
                  fill
                  sizes="(min-width: 640px) 512px, 100vw"
                  className="object-cover"
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
