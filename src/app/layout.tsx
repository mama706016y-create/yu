// ============================================
// 全站共用版型（Root Layout）
// 所有頁面都會被包在這個元件裡，適合放導覽列、頁尾、字體載入等共用內容
// ============================================

import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: '我的菜單食譜',
  description: '用 Notion 管理、Next.js 呈現的私房菜單與食譜',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <head>
        {/*
          直接透過 <link> 載入 Google Fonts，而不是用 next/font
          原因：Noto Serif TC / Noto Sans TC 這類中文字體檔案非常龐大（涵蓋數千個中文字），
          用瀏覽器原生的 Google Fonts CDN 載入，可以利用瀏覽器快取與 Google 的全球節點，
          比起把整個字體打包進 Next.js 專案更有效率
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* 頁首導覽列 */}
        <header className="border-b border-parchment/10">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <Link href="/" className="font-display text-xl text-parchment">
              我的<span className="text-saffron">菜單</span>食譜
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>

        {/* 頁尾 */}
        <footer className="border-t border-parchment/10 mt-20">
          <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-parchment/40 text-center">
            以 Notion 管理內容・由 Next.js 打造
          </div>
        </footer>
      </body>
    </html>
  );
}
