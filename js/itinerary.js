// 일정 목록 구성과 순서 조작 (순수 함수)
import { DAY_COLORS, routeForDay, visibleLayers } from './map/model.js';
import { savePlace } from './places.js';

const DAY_IDS = Object.keys(DAY_COLORS);

export function daySections(places, days, filter) {
  const ids = filter === 'all' ? DAY_IDS : DAY_IDS.includes(filter) ? [filter] : [];
  return ids.map((dayId) => ({
    dayId,
    label: days.find((d) => d.id === dayId)?.label ?? dayId,
    color: DAY_COLORS[dayId],
    items: routeForDay(places, dayId),
    stays: visibleLayers(places, dayId).stays,
  }));
}

export function candidateItems(places) {
  return places
    .filter((p) => p.kind === 'candidate' || (p.kind === 'plan' && !DAY_IDS.includes(p.dayId)))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'ko'));
}

export function moveInDay(places, id, dir) {
  const target = places.find((p) => p.id === id);
  if (!target || target.kind !== 'plan') return places;
  // 같은 순서값이면 원래 배열 순서를 유지(안정 정렬)
  const dayItems = places
    .map((p, i) => [p, i])
    .filter(([p]) => p.kind === 'plan' && p.dayId === target.dayId)
    .sort(([a, i], [b, j]) => ((a.order ?? 0) - (b.order ?? 0)) || i - j)
    .map(([p]) => p.id);
  const from = dayItems.indexOf(id);
  const to = from + dir;
  if (to < 0 || to >= dayItems.length) return places;
  [dayItems[from], dayItems[to]] = [dayItems[to], dayItems[from]];
  return places.map((p) => (dayItems.includes(p.id) ? { ...p, order: dayItems.indexOf(p.id) + 1 } : p));
}

export function addToDay(places, id, dayId) {
  const target = places.find((p) => p.id === id);
  if (!target || !DAY_IDS.includes(dayId)) return places;
  return savePlace(places, { ...target, kind: 'plan', dayId });
}

export function timeWarnings(items) {
  const warn = new Set();
  let last = null;
  for (const p of items) {
    if (!p.time) continue;
    if (last && p.time < last) warn.add(p.id);
    else last = p.time;
  }
  return warn;
}
