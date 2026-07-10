// ============================================
// 食譜卡片元件
// 首頁的每一個「菜單方塊」都是這個元件
// 點擊後會導向 /recipes/[id] 詳細食譜頁面
// ============================================

import Link from 'next/link';
import type { Recipe } from '@/types/recipe';
import CookTimeBadge from './CookTimeBadge';

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="
        group relative block
        bg-card rounded-xl overflow-hidden
        border border-parchment/10
        transition-transform duration-300
        hover:-translate-y-1 hover:border-saffron/40
      "
    >
      {/* 封面圖片區塊，若 Notion 沒有設定圖片則顯示預設底色 */}
      <div className="relative aspect-[4/3] bg-hearth overflow-hidden">
        {recipe.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.coverUrl}
            alt={recipe.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-parchment/20 font-display text-4xl">
            食
          </div>
        )}
        <CookTimeBadge minutes={recipe.cookTime} />
      </div>

      <div className="p-4">
        {/* 分類標籤 */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {recipe.categories.map((cat) => (
            <span
              key={cat}
              className="text-[11px] px-2 py-0.5 rounded-full bg-herb/15 text-herb border border-herb/30"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* 菜名，使用展示字體強調風格 */}
        <h3 className="font-display text-lg text-parchment group-hover:text-saffron transition-colors">
          {recipe.name}
        </h3>

        {/* 食材摘要，只顯示第一行避免卡片過長 */}
        {recipe.ingredients && (
          <p className="text-sm text-parchment/50 mt-1 line-clamp-1">
            {recipe.ingredients}
          </p>
        )}
      </div>
    </Link>
  );
}
