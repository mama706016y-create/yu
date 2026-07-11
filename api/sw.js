// sw.js - Service Worker
// 負責離線快取，讓網站「加入主畫面」後也能像 App 一樣快速開啟

const CACHE_NAME = 'recipe-book-cache-v1'; // 之後若更新網站，記得改版本號（例如 v2）讓瀏覽器重新快取

// 需要預先快取的靜態檔案（骨架），這些檔案不常變動
const PRECACHE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// 安裝階段：把骨架檔案先下載存進快取
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_FILES);
    })
  );
  self.skipWaiting(); // 讓新版 Service Worker 立即生效
});

// 啟用階段：清掉舊版本的快取，避免佔用空間
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 攔截網路請求
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 【重要】API 請求（/api/recipes）一律走網路，確保永遠拿到 Notion 最新資料
  // 絕對不快取 API，不然新增的食譜會一直看不到
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 其他靜態資源：優先用快取（Cache First），沒有快取才去網路抓，並存進快取
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // 只快取成功的 GET 請求
          if (event.request.method === 'GET' && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      }).catch(() => {
        // 完全離線又沒快取時，至少回傳首頁，避免白畫面
        return caches.match('/index.html');
      });
    })
  );
});
