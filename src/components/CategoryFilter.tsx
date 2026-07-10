// ============================================
// 分類篩選元件
// 用「網址參數」（?category=主食）來實作篩選，完全不需要寫用戶端 JavaScript
// 每個分類都是一個真實的連結，對 SEO 跟分享連結都很友善
// ============================================

import Link from 'next/link';
import { CATEGORIES } from '@/types/recipe';

export default function CategoryFilter({
  activeCategory,
}: {
  activeCategory?: string;
}) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-parchment/10 mb-8">
      {/* 「全部」永遠排在第一個，代表不套用任何篩選 */}
      <Link
        href="/"
        className={`
          px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
          ${
            !activeCategory
              ? 'border-saffron text-saffron'
              : 'border-transparent text-parchment/50 hover:text-parchment'
          }
        `}
      >
        全部
      </Link>

      {CATEGORIES.map((cat) => (
        <Link
          key={cat}
          href={`/?category=${encodeURIComponent(cat)}`}
          className={`
            px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
            ${
              activeCategory === cat
                ? 'border-saffron text-saffron'
                : 'border-transparent text-parchment/50 hover:text-parchment'
            }
          `}
        >
          {cat}
        </Link>
      ))}
    </nav>
  );
}
