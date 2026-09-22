function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007Z" />
    </svg>
  );
}

function Heart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.645 20.91a.75.75 0 0 1-.704 0c-.115-.06-.256-.138-.383-.218a25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17c-.127.08-.268.157-.383.218Z" />
    </svg>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    </svg>
  );
}

const DECORATIONS = [
  { Icon: Star, top: "4%", left: "8%", size: "w-6 h-6", color: "text-yellow-300", rotate: "-rotate-12" },
  { Icon: Heart, top: "10%", left: "85%", size: "w-6 h-6", color: "text-pink-300", rotate: "rotate-6" },
  { Icon: Sparkle, top: "20%", left: "45%", size: "w-5 h-5", color: "text-sky-300", rotate: "rotate-3" },
  { Icon: Star, top: "28%", left: "92%", size: "w-4 h-4", color: "text-purple-300", rotate: "rotate-12" },
  { Icon: Heart, top: "38%", left: "4%", size: "w-5 h-5", color: "text-rose-300", rotate: "-rotate-6" },
  { Icon: Sparkle, top: "48%", left: "88%", size: "w-6 h-6", color: "text-indigo-300", rotate: "rotate-0" },
  { Icon: Star, top: "58%", left: "10%", size: "w-5 h-5", color: "text-sky-300", rotate: "rotate-6" },
  { Icon: Heart, top: "66%", left: "90%", size: "w-4 h-4", color: "text-yellow-300", rotate: "rotate-12" },
  { Icon: Sparkle, top: "76%", left: "6%", size: "w-6 h-6", color: "text-pink-300", rotate: "-rotate-3" },
  { Icon: Star, top: "85%", left: "80%", size: "w-6 h-6", color: "text-purple-300", rotate: "rotate-12" },
  { Icon: Heart, top: "2%", left: "60%", size: "w-4 h-4", color: "text-indigo-300", rotate: "rotate-6" },
  { Icon: Sparkle, top: "92%", left: "40%", size: "w-5 h-5", color: "text-rose-300", rotate: "rotate-0" },
];

export function DecorativeBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-sky-100 via-violet-100 to-pink-100"
    >
      {DECORATIONS.map(({ Icon, top, left, size, color, rotate }, index) => (
        <span
          key={index}
          className={`absolute opacity-70 ${size} ${color} ${rotate}`}
          style={{ top, left }}
        >
          <Icon className="h-full w-full" />
        </span>
      ))}
    </div>
  );
}
