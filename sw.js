// 배포할 때마다 CACHE_VERSION을 올려야 폰에 새 버전이 반영된다.
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'fukuoka-trip-' + CACHE_VERSION;

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/app.js",
  "./js/store.js",
  "./js/router.js",
  "./js/tabs/map.js",
  "./js/tabs/checklist.js",
  "./js/tabs/transit.js",
  "./js/tabs/expense.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    // cache: 'reload' — 브라우저 HTTP 캐시에 남은 옛 파일 대신 서버의 새 파일을 받는다
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(APP_FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('fukuoka-trip-') && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 화면(HTML)은 네트워크 우선 → 새 버전이 바로 보이게, 실패하면 캐시
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 같은 출처의 앱 파일은 캐시 우선. 다른 출처(지도 타일 등)는 건드리지 않는다.
  if (new URL(req.url).origin === self.location.origin) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
