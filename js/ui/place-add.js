import { esc, html, toast } from './dom.js';
import { openSheet, closeSheet, isSheetOpen } from './sheet.js';
import { searchPlaces } from '../geocode.js';

// ＋ 버튼: 추가 방법 고르기. onPick({ lat, lng, name?, address? })
export function openAddMenu({ onPick }) {
  const el = html`
    <div class="menu">
      <button type="button" class="menu-item" data-act="here">
        <strong>현재 위치로 추가</strong><span>지금 있는 곳을 장소로 저장해요</span></button>
      <button type="button" class="menu-item" data-act="search">
        <strong>이름으로 검색</strong><span>일본어·영어 이름이 가장 잘 찾아져요</span></button>
      <p class="menu-tip">작은 가게는 검색에 안 나올 수 있어요. <b>지도를 길게 누르면</b> 그 자리에 바로 추가할 수 있어요.</p>
    </div>`;
  el.querySelector('[data-act="here"]').addEventListener('click', () => addHere(onPick));
  el.querySelector('[data-act="search"]').addEventListener('click', () => openSearch(onPick));
  openSheet(el, { title: '장소 추가' });
}

function addHere(onPick) {
  if (!navigator.geolocation) {
    toast('이 기기에서는 위치를 확인할 수 없어요');
    return;
  }
  toast('현재 위치를 확인하는 중…');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (!isSheetOpen()) return; // 기다리는 동안 창을 닫았으면 무시
      onPick({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: '현재 위치' });
    },
    (err) => isSheetOpen() && toast(err.code === err.PERMISSION_DENIED
      ? '위치 권한이 꺼져 있어요. 브라우저 설정에서 허용해주세요'
      : '현재 위치를 찾지 못했어요. 잠시 후 다시 시도해주세요'),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
  );
}

function openSearch(onPick) {
  const el = html`
    <div class="search">
      <input type="search" class="search-input" placeholder="예: 하카타역, 캐널시티, 후쿠오카 타워" autocomplete="off" enterkeyhint="search">
      <p class="search-status" role="status"></p>
      <ul class="search-results"></ul>
    </div>`;
  const input = el.querySelector('input');
  const status = el.querySelector('.search-status');
  const list = el.querySelector('.search-results');
  let timer = null;
  let controller = null;

  async function run() {
    const q = input.value.trim();
    controller?.abort();
    list.replaceChildren();
    if (q.length < 2) { status.textContent = ''; return; }
    controller = new AbortController();
    status.textContent = '검색 중…';
    try {
      const results = await searchPlaces(q, { signal: controller.signal });
      status.textContent = results.length ? '' : '결과가 없어요. 띄어쓰기를 바꾸거나 일본어·영어 이름으로 찾아보세요. 지도를 길게 눌러 직접 추가할 수도 있어요';
      for (const r of results) {
        const li = html`<li><button type="button" class="result">
          <strong>${esc(r.name)}</strong><span>${esc(r.address)}</span></button></li>`;
        li.querySelector('button').addEventListener('click', () => onPick(r));
        list.append(li);
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      status.textContent = e.message === 'offline'
        ? '인터넷 연결을 확인해주세요'
        : '검색이 잠시 안 돼요. 잠시 후 다시 시도해주세요';
    }
  }

  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 600); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { clearTimeout(timer); run(); } });
  openSheet(el, { title: '이름으로 검색', onClose: () => { clearTimeout(timer); controller?.abort(); } });
  setTimeout(() => input.focus(), 300);
}

export { closeSheet };
