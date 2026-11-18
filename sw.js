// 배포할 때마다 CACHE_VERSION을 올려야 폰에 새 버전이 반영된다.
const CACHE_VERSION = 'v6';
const CACHE_NAME = 'fukuoka-trip-' + CACHE_VERSION;

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/app.js",
  "./js/splash.js",
  "./js/store.js",
  "./js/router.js",
  "./js/photos.js",
  "./js/map/model.js",
  "./js/vendor/leaflet.js",
  "./js/vendor/leaflet.css",
  "./js/tabs/home.js",
  "./js/tabs/map.js",
  "./js/tabs/checklist.js",
  "./js/tabs/transit.js",
  "./js/tabs/expense.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./photos/main.jpg",
  "./photos/main-thumb.jpg"
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

const NETWORK_TIMEOUT_MS = 3000;

// 네트워크 우선: 성공(2xx)한 응답만 캐시에 갱신한다. 네트워크가 느리면(3초) 캐시로 먼저 응답한다.
// CACHE_VERSION을 깜빡해도 온라인이면 새 파일을 받는다.
function networkFirst(event, cacheKey) {
  const req = event.request;
  // cache: 'no-cache' — 브라우저 HTTP 캐시(GitHub Pages max-age=600)를 거치지 않고 서버에 확인한다(변경 없으면 304로 가볍게)
  const network = fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      event.waitUntil(caches.open(CACHE_NAME).then((c) => c.put(cacheKey, copy)));
    }
    return res;
  });
  const cached = () => caches.match(cacheKey);
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS)).then(cached);
  return Promise.race([network.catch(cached), timeout])
    .then((res) => res || network.catch(cached));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 화면(HTML): 오프라인이면 캐시된 index.html
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(event, './index.html'));
    return;
  }

  // 같은 출처의 앱 파일. 다른 출처(지도 타일 등)는 건드리지 않는다.
  if (new URL(req.url).origin === self.location.origin) {
    event.respondWith(networkFirst(event, req));
  }
});
