// ============================================
// 食譜詳細頁面
// 路徑：/recipes/[id]，id 是 Notion 的頁面 ID
// 顯示：封面圖、菜名、分類、食材、烹飪時間，以及頁面內文（做法步驟）
// ============================================

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getRecipeById, getRecipeBlocks } from '@/lib/notion';
import NotionBlocks from '@/components/NotionBlocks';
import CookTimeBadge from '@/components/CookTimeBadge';

export const revalidate = 3600; // 原因同首頁：配合 Notion 圖片網址的有效期

// Next.js 15：動態路由的 params 也是 Promise
type Props = {
  params: Promise<{ id: string }>;
};

// 動態產生分頁標題，讓每道食譜的瀏覽器分頁標題都不一樣，對 SEO 與分享都比較好
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  if (!recipe) return { title: '找不到食譜' };
  return {
    title: `${recipe.name}｜我的菜單食譜`,
    description: recipe.ingredients,
  };
}

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;

  // 同時發出兩個請求（食譜屬性 + 頁面內文），用 Promise.all 平行處理，加快載入速度
  const [recipe, blocks] = await Promise.all([
    getRecipeById(id),
    getRecipeBlocks(id),
  ]);

  // 找不到食譜，或食譜取回失敗時，導向 Next.js 內建的 404 頁面
  if (!recipe) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto">
      {/* 封面圖片 */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-card mb-6">
        {recipe.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.coverUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-parchment/20 font-display text-6xl">
            食
          </div>
        )}
        <CookTimeBadge minutes={recipe.cookTime} />
      </div>

      {/* 分類標籤 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {recipe.categories.map((cat) => (
          <span
            key={cat}
            className="text-xs px-2.5 py-1 rounded-full bg-herb/15 text-herb border border-herb/30"
          >
            {cat}
          </span>
        ))}
      </div>

      {/* 菜名 */}
      <h1 className="font-display text-3xl md:text-4xl text-parchment mb-4">
        {recipe.name}
      </h1>

      {/* 食材區塊 */}
      {recipe.ingredients && (
        <div className="bg-card rounded-lg p-5 mb-8 border border-parchment/10">
          <h2 className="font-display text-lg text-saffron mb-2">食材</h2>
          <p className="text-parchment/80 whitespace-pre-line leading-relaxed">
            {recipe.ingredients}
          </p>
        </div>
      )}

      {/* 做法步驟：來自 Notion 頁面內文 */}
      <div>
        <h2 className="font-display text-lg text-saffron mb-3">做法</h2>
        <NotionBlocks blocks={blocks} />
      </div>
    </article>
  );
}
