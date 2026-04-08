// ── バージョンをここで管理 ────────────────────────────────────────
// デプロイのたびにインクリメントする → 古いキャッシュが自動削除される
const CACHE_VERSION = 'v4';
const CACHE_NAME    = `routine-${CACHE_VERSION}`;

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// インストール時: 全ファイルをキャッシュ
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// アクティベート時: 古いバージョンのキャッシュを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// フェッチ: HTML はネットワーク優先（即時反映）、他はキャッシュ優先
self.addEventListener('fetch', e => {
  const url = e.request.url;
  const isHtml = url.endsWith('.html') || url.endsWith('/') || !url.includes('.');

  if (isHtml) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
