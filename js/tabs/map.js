import { MAP_FILTERS, CANDIDATE_COLOR, STAY_COLOR, visibleLayers, SAMPLE_PLACES } from '../map/model.js';

const CENTER = [33.5902, 130.4017]; // 하카타~텐진
const ZOOM = 13;
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

let map = null;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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

function draw(layerGroup, places, filter, days, isSample) {
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
      L.marker([p.lat, p.lng], { icon: numberIcon(i + 1, r.color, isSample), zIndexOffset: 100 })
        .bindPopup(popup(p, sub)).addTo(layerGroup);
      points.push([p.lat, p.lng]);
    });
  }
  for (const p of v.candidates) {
    L.marker([p.lat, p.lng], { icon: dotIcon(isSample || dimCandidates) })
      .bindPopup(popup(p, '후보')).addTo(layerGroup);
    if (!dimCandidates) points.push([p.lat, p.lng]);
  }
  for (const p of v.stays) {
    L.marker([p.lat, p.lng], { icon: stayIcon(isSample), zIndexOffset: 50 })
      .bindPopup(popup(p, '숙소')).addTo(layerGroup);
    points.push([p.lat, p.lng]);
  }

  if (points.length > 1) map.fitBounds(points, { paddingTopLeft: [32, 90], paddingBottomRight: [32, 32], maxZoom: 15 });
  else if (points.length === 1) map.setView(points[0], 15);
  else map.setView(CENTER, ZOOM);
}

export function mount(el, store) {
  unmount();
  const state = store.get();
  const days = state.trip.days;
  const labels = filterLabels(days);
  const isSample = state.places.length === 0;
  const places = isSample ? SAMPLE_PLACES : state.places;
  let filter = MAP_FILTERS.includes(state.ui.mapFilter) ? state.ui.mapFilter : 'all';

  el.innerHTML = `
    <section class="map-page">
      <div id="map" class="map"></div>
      <div class="map-top">
        <div class="chips" role="tablist" aria-label="일차 선택">
          ${MAP_FILTERS.map((f) => `<button type="button" class="chip" role="tab" data-filter="${f}">${esc(labels[f] ?? f)}</button>`).join('')}
        </div>
        ${isSample ? '<p class="map-note">예시 장소입니다. 3단계에서 직접 추가할 수 있어요.</p>' : ''}
      </div>
    </section>`;

  map = L.map(el.querySelector('#map'), { zoomControl: false, attributionControl: true }).setView(CENTER, ZOOM);
  L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
  map.attributionControl.setPrefix(false);
  const layerGroup = L.layerGroup().addTo(map);

  const chips = [...el.querySelectorAll('.chip')];
  function select(f) {
    filter = f;
    chips.forEach((c) => c.setAttribute('aria-selected', String(c.dataset.filter === f)));
    draw(layerGroup, places, f, days, isSample);
  }
  chips.forEach((c) => c.addEventListener('click', () => {
    store.update((d) => { d.ui.mapFilter = c.dataset.filter; });
    select(c.dataset.filter);
  }));

  // 탭 전환 직후 크기를 다시 계산해야 지도가 깨지지 않는다
  requestAnimationFrame(() => { if (map) { map.invalidateSize(); select(filter); } });
}

export function unmount() {
  if (map) {
    map.remove();
    map = null;
  }
}
