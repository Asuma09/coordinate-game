"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CameraIcon, GridIcon, CrownIcon } from "@/components/icons";

const NAV_ITEMS = [
  {
    href: "/outfits/new",
    label: "撮影",
    Icon: CameraIcon,
    gradient: "from-pink-400 to-orange-300",
  },
  {
    href: "/collection",
    label: "コレクション",
    Icon: GridIcon,
    gradient: "from-sky-400 to-blue-400",
  },
  {
    href: "/ranking",
    label: "ランキング",
    Icon: CrownIcon,
    gradient: "from-violet-400 to-purple-400",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-white/70 bg-white/90 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(139,92,246,0.35)] backdrop-blur-md">
      {NAV_ITEMS.map(({ href, label, Icon, gradient }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center gap-1 py-1"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                isActive
                  ? `bg-gradient-to-br ${gradient} text-white shadow-md`
                  : "text-gray-400"
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span
              className={`text-[11px] font-medium ${
                isActive ? "text-gray-700" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
