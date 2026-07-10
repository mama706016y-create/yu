// ============================================
// 首頁
// 負責：抓取所有「已公開」的食譜、依網址參數篩選分類、渲染食譜卡片列表
// ============================================

import { getPublishedRecipes } from '@/lib/notion';
import RecipeCard from '@/components/RecipeCard';
import CategoryFilter from '@/components/CategoryFilter';

// ISR（Incremental Static Regeneration）設定：
// 頁面會被快取，每 3600 秒（1 小時）重新向 Notion 抓一次最新資料
// 這個時間刻意設定為 1 小時，是因為 Notion 圖片網址（簽名網址）大約 1 小時後會失效，
// 讓重新驗證的頻率跟圖片網址的有效期一致，可以避免畫面出現圖片破圖的狀況
export const revalidate = 3600;

// Next.js 15 開始，searchParams 是一個 Promise，需要 await 才能取值
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const recipes = await getPublishedRecipes(category);

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-display text-3xl text-parchment mb-2">
          今天想吃點什麼？
        </h1>
        <p className="text-parchment/50">
          {category ? `分類：${category}` : '瀏覽全部菜單，或點選分類快速篩選'}
        </p>
      </div>

      <CategoryFilter activeCategory={category} />

      {recipes.length === 0 ? (
        // 空狀態：告訴使用者發生了什麼事、可以怎麼做
        <div className="text-center py-20 text-parchment/40">
          <p className="font-display text-xl mb-2">目前沒有符合的菜色</p>
          <p className="text-sm">
            請確認 Notion 資料庫中是否有已勾選「Published」的食譜
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
