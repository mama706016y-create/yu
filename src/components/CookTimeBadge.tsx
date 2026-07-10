// ============================================
// 烹飪時間徽章元件
// 這是整個網站的「簽名視覺元素」：把烹飪時間做成像廚房計時器的圓形印章
// 用意是讓使用者一眼掃過卡片，就能快速比較「哪道菜比較快能上桌」
// ============================================

export default function CookTimeBadge({ minutes }: { minutes: number | null }) {
  if (minutes === null) return null;

  return (
    <div
      className="
        absolute top-3 right-3
        w-14 h-14 rounded-full
        bg-hearth/90 border-2 border-dashed border-saffron
        flex flex-col items-center justify-center
        rotate-6
        shadow-lg
      "
      aria-label={`烹飪時間 ${minutes} 分鐘`}
    >
      <span className="font-display text-lg leading-none text-saffron font-semibold">
        {minutes}
      </span>
      <span className="text-[9px] leading-none text-parchment/70 mt-0.5">
        分鐘
      </span>
    </div>
  );
}
