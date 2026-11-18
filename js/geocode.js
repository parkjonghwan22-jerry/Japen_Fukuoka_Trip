// 장소 이름 검색 (OpenStreetMap Nominatim — 무료, 키 없음, 1초 1회 이하로 사용)
const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const FUKUOKA_VIEWBOX = '130.20,33.75,130.65,33.40'; // 왼쪽,위,오른쪽,아래 — 이 범위를 우선

export function searchUrl(query) {
  const u = new URL(ENDPOINT);
  u.search = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    'accept-language': 'ko,ja,en',
    limit: '8',
    viewbox: FUKUOKA_VIEWBOX,
    countrycodes: 'jp',
  }).toString();
  return u.toString();
}

export function parseNominatim(json) {
  if (!Array.isArray(json)) return [];
  const out = [];
  for (const r of json) {
    const lat = Number(r?.lat);
    const lng = Number(r?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const parts = String(r.display_name ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const name = (r.name && String(r.name).trim()) || parts[0] || '이름 없음';
    const address = (parts[0] === name ? parts.slice(1) : parts).join(', ');
    out.push({ name, address, lat, lng });
  }
  return out;
}

let lastRequest = 0;

// 실패하면 Error('offline') 또는 Error('failed')
export async function searchPlaces(query, { signal } = {}) {
  const wait = Math.max(0, lastRequest + 1000 - Date.now());
  if (wait) await new Promise((r) => setTimeout(r, wait));
  if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
  lastRequest = Date.now();
  let res;
  try {
    res = await fetch(searchUrl(query), { signal, headers: { Accept: 'application/json' } });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error('offline');
  }
  if (!res.ok) throw new Error('failed');
  return parseNominatim(await res.json());
}
