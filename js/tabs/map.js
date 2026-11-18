import { MAP_FILTERS, CANDIDATE_COLOR, STAY_COLOR, visibleLayers, SAMPLE_PLACES } from '../map/model.js';
import { savePlace, deletePlace } from '../places.js';
import { esc, toast } from '../ui/dom.js';
import { closeSheet, isSheetOpen } from '../ui/sheet.js';
import { openPlaceCard } from '../ui/place-card.js';
import { openPlaceForm } from '../ui/place-form.js';
import { openAddMenu } from '../ui/place-add.js';
import { createDayPanel } from '../ui/day-panel.js';
import { moveInDay, addToDay } from '../itinerary.js';

const PANEL_PEEK = 76; // 접힌 일정 패널 높이(px) — CSS .panel 과 맞춤

const CENTER = [33.5902, 130.4017]; // 하카타~텐진
const ZOOM = 13;
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

let map = null;


function filterLabels(days) {
  const labels = { all: '전체', candidates: '후보' };
  for (const d of days) labels[d.id] = d.label;
  return labels;
}

function numberIcon(n, color, dim) {
  return L.divIcon({
    className: 'mk-wrap' + (dim ? ' mk-dim' : ''),
    html: `<span class="mk-num" style="background:${color}">${n}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });
}

function dotIcon(dim) {
  return L.divIcon({
    className: 'mk-wrap' + (dim ? ' mk-dim' : ''),
    html: `<span class="mk-dot" style="background:${CANDIDATE_COLOR}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

function stayIcon(dim) {
  return L.divIcon({
    className: 'mk-wrap' + (dim ? ' mk-dim' : ''),
    html: `<span class="mk-stay" style="background:${STAY_COLOR}">숙</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });
}

function popup(p, sub) {
  return `<div class="pop"><strong>${esc(p.name)}</strong>${sub ? `<span>${esc(sub)}</span>` : ''}</div>`;
}

// 예시 장소는 말풍선, 실제 장소는 누르면 onOpen(place)
function attach(marker, p, sub, isSample, onOpen) {
  if (isSample) marker.bindPopup(popup(p, sub));
  else marker.on('click', () => onOpen(p));
  return marker;
}

function draw(layerGroup, places, filter, days, isSample, { fit = true, onOpen } = {}) {
  layerGroup.clearLayers();
  const v = visibleLayers(places, filter);
  const dayLabel = Object.fromEntries(days.map((d) => [d.id, d.label]));
  const dimCandidates = filter !== 'all' && filter !== 'candidates';
  const points = [];

  for (const r of v.routes) {
    const latlngs = r.places.map((p) => [p.lat, p.lng]);
    if (latlngs.length > 1) {
      L.polyline(latlngs, { color: r.color, weight: 4, opacity: isSample ? 0.45 : 0.85 }).addTo(layerGroup);
    }
    r.places.forEach((p, i) => {
      const sub = [dayLabel[r.dayId], p.time].filter(Boolean).join(' · ');
      attach(L.marker([p.lat, p.lng], { icon: numberIcon(i + 1, r.color, isSample), zIndexOffset: 100 }), p, sub, isSample, onOpen)
        .addTo(layerGroup);
      points.push([p.lat, p.lng]);
    });
  }
  for (const p of v.candidates) {
    attach(L.marker([p.lat, p.lng], { icon: dotIcon(isSample || dimCandidates) }), p, '후보', isSample, onOpen)
      .addTo(layerGroup);
    if (!dimCandidates) points.push([p.lat, p.lng]);
  }
  for (const p of v.stays) {
    attach(L.marker([p.lat, p.lng], { icon: stayIcon(isSample), zIndexOffset: 50 }), p, '숙소', isSample, onOpen)
      .addTo(layerGroup);
    points.push([p.lat, p.lng]);
  }

  if (!fit) return;
  if (points.length > 1) map.fitBounds(points, { paddingTopLeft: [32, 90], paddingBottomRight: [32, 32 + PANEL_PEEK], maxZoom: 15 });
  else if (points.length === 1) map.setView(points[0], 15);
  else map.setView(CENTER, ZOOM);
}

// 저장한 장소가 지금 필터에서 안 보이면 보이는 필터로 바꾼다
function filterShowing(place, filter) {
  if (filter === 'all') return 'all';
  if (place.kind === 'plan') return place.dayId === filter ? filter : place.dayId;
  if (place.kind === 'candidate') return filter;
  return filter; // 숙소는 대부분 필터에서 보인다
}

export function mount(el, store) {
  unmount();
  if (typeof L === 'undefined') {
    el.innerHTML = `
      <section class="page">
        <h1>지도</h1>
        <p class="placeholder">지도를 불러오지 못했어요. 인터넷에 연결한 뒤 앱을 다시 열어주세요.</p>
      </section>`;
    return;
  }
  const days = store.get().trip.days;
  const labels = filterLabels(days);
  let filter = MAP_FILTERS.includes(store.get().ui.mapFilter) ? store.get().ui.mapFilter : 'all';

  el.innerHTML = `
    <section class="map-page">
      <div id="map" class="map"></div>
      <div class="map-top">
        <div class="chips" role="tablist" aria-label="일차 선택">
          ${MAP_FILTERS.map((f) => `<button type="button" class="chip" role="tab" data-filter="${f}">${esc(labels[f] ?? f)}</button>`).join('')}
        </div>
        <p class="map-note" hidden>예시 장소입니다. 지도를 길게 누르거나 ＋로 직접 추가해보세요.</p>
      </div>
      <button type="button" class="fab" aria-label="장소 추가">＋</button>
    </section>`;

  map = L.map(el.querySelector('#map'), { zoomControl: false, attributionControl: true }).setView(CENTER, ZOOM);
  L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
  map.attributionControl.setPrefix(false);
  const layerGroup = L.layerGroup().addTo(map);
  const note = el.querySelector('.map-note');
  const chips = [...el.querySelectorAll('.chip')];

  const panel = createDayPanel(el.querySelector('.map-page'), {
    onSelect: (p) => focusPlace(p),
    onMove: (id, dir) => {
      store.update((d) => { d.places = moveInDay(d.places, id, dir); });
      render({ fit: false });
    },
    onAddToDay: (id, dayId) => {
      store.update((d) => { d.places = addToDay(d.places, id, dayId); });
      render({ fit: false });
      toast(`${days.find((d) => d.id === dayId)?.label ?? ''} 일정에 넣었어요`);
    },
  });
  // ＋ 버튼은 패널 위에 오도록 패널 뒤에 둔다
  panel.element.after(el.querySelector('.fab'));

  // 장소로 이동: 패널을 접고, 장소가 화면 위쪽(카드에 가리지 않게)에 오도록 맞춘 뒤 카드 열기
  function focusPlace(p) {
    panel.collapse();
    const zoom = Math.max(map.getZoom(), 16);
    const h = map.getSize().y;
    const point = map.project([p.lat, p.lng], zoom).add([0, h * 0.22]);
    map.flyTo(map.unproject(point, zoom), zoom, { duration: 0.6 });
    if (store.get().places.length) setTimeout(() => openCard(p), 350);
  }

  function render({ fit = true } = {}) {
    if (!map) return;
    const state = store.get();
    const isSample = state.places.length === 0;
    const places = isSample ? SAMPLE_PLACES : state.places;
    note.hidden = !isSample;
    chips.forEach((c) => c.setAttribute('aria-selected', String(c.dataset.filter === filter)));
    draw(layerGroup, places, filter, days, isSample, { fit, onOpen: openCard });
    panel.update({ places, days, filter, isSample });
  }

  function setFilter(f) {
    filter = f;
    store.update((d) => { d.ui.mapFilter = f; });
  }

  function save(place) {
    const before = store.get().places;
    const next = savePlace(before, place);
    const saved = place.id
      ? next.find((p) => p.id === place.id)
      : next.find((p) => !before.some((b) => b.id === p.id));
    store.update((d) => { d.places = next; });
    const nextFilter = saved ? filterShowing(saved, filter) : filter;
    const changed = nextFilter !== filter;
    if (changed) setFilter(nextFilter);
    render({ fit: changed });
    toast(place.id ? '저장했어요' : '추가했어요');
  }

  function openForm(initial) {
    openPlaceForm(initial, { days, onSave: save });
  }

  function openCard(place) {
    openPlaceCard(place, {
      days,
      onEdit: (p) => openForm(p),
      onDelete: (p) => {
        store.update((d) => { d.places = deletePlace(d.places, p.id); });
        render({ fit: false });
        toast('삭제했어요');
      },
    });
  }

  chips.forEach((c) => c.addEventListener('click', () => { setFilter(c.dataset.filter); render(); }));

  // 지도를 길게 누르면 그 자리에 새 장소
  map.on('contextmenu', (e) => {
    openForm({ lat: e.latlng.lat, lng: e.latlng.lng, kind: filter.startsWith('d') ? 'plan' : 'candidate', dayId: filter.startsWith('d') ? filter : null });
  });

  el.querySelector('.fab').addEventListener('click', () => {
    openAddMenu({
      onPick: (r) => openForm({
        ...r,
        kind: filter.startsWith('d') ? 'plan' : 'candidate',
        dayId: filter.startsWith('d') ? filter : null,
      }),
    });
  });

  // 탭 전환 직후 크기를 다시 계산해야 지도가 깨지지 않는다
  requestAnimationFrame(() => { if (map) { map.invalidateSize(); render(); } });
}

export function unmount() {
  if (isSheetOpen()) closeSheet();
  if (map) {
    map.remove();
    map = null;
  }
}
