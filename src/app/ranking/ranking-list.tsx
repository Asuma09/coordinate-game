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

export function RankingList({ outfits }: { outfits: RankingOutfit[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="flex flex-col gap-2">
      {outfits.map((outfit, index) => {
        const isOpen = openId === outfit.id;
        return (
          <li
            key={outfit.id}
            className="overflow-hidden rounded-md border border-gray-200"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : outfit.id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
            >
              <span className="w-6 shrink-0 text-sm font-semibold text-gray-400">
                {index + 1}
              </span>
              <span className="flex-1 truncate text-sm font-medium">
                {outfit.nickname ?? "ゲスト"}
              </span>
              <span className="shrink-0 text-sm font-bold">
                {outfit.score_total}点
              </span>
            </button>

            {isOpen && (
              <div className="relative aspect-square w-full border-t border-gray-200 bg-gray-100">
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
