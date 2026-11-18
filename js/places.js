// 장소 데이터 규칙: 입력 검증·정리, 저장, 삭제, 순서 관리
import { DAY_COLORS, hasCoords } from './map/model.js';
import { newId } from './store.js';

export const KINDS = ['plan', 'candidate', 'stay'];
export const KIND_LABELS = { plan: '일정', candidate: '후보', stay: '숙소' };
export const CATEGORIES = ['맛집', '카페', '쇼핑', '관광', '기타'];
export const NEW_YEAR = ['open', 'closed', 'unknown'];
export const NEW_YEAR_LABELS = { open: '영업', closed: '휴무', unknown: '미확인' };
export const STAY_OPTIONS = [null, 30, 60, 90, 120, 180];
const DAY_IDS = Object.keys(DAY_COLORS);

const text = (v) => {
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
  return s === '' ? null : s;
};
const num = (v) => {
  if (v === '' || v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

export function validatePlace(input) {
  const errors = {};
  const kind = KINDS.includes(input.kind) ? input.kind : 'candidate';
  const name = text(input.name);
  if (!name) errors.name = '이름을 입력해주세요';

  const lat = num(input.lat);
  const lng = num(input.lng);
  if (!hasCoords({ lat, lng })) errors.location = '위치를 정해주세요';

  let dayId = null;
  if (kind === 'plan') {
    if (DAY_IDS.includes(input.dayId)) dayId = input.dayId;
    else errors.dayId = '일차를 골라주세요';
  }

  const stayMinutes = num(input.stayMinutes);
  const place = {
    id: input.id ?? null,
    name,
    lat,
    lng,
    kind,
    dayId,
    order: kind === 'plan' ? num(input.order) : 0,
    stayDayIds: kind === 'stay' && Array.isArray(input.stayDayIds)
      ? DAY_IDS.filter((d) => input.stayDayIds.includes(d))
      : [],
    category: CATEGORIES.includes(input.category) ? input.category : '기타',
    time: text(input.time),
    stayMinutes: STAY_OPTIONS.includes(stayMinutes) ? stayMinutes : null,
    memo: text(input.memo),
    hours: text(input.hours),
    newYearOpen: NEW_YEAR.includes(input.newYearOpen) ? input.newYearOpen : 'unknown',
  };

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, place };
}

// 일차 안 순서를 1,2,3…으로 다시 매긴다 (기존 순서 유지)
function renumber(places, dayId) {
  const ids = places
    .filter((p) => p.kind === 'plan' && p.dayId === dayId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) => p.id);
  return places.map((p) => (ids.includes(p.id) ? { ...p, order: ids.indexOf(p.id) + 1 } : p));
}

const lastOrder = (places, dayId) =>
  places.filter((p) => p.kind === 'plan' && p.dayId === dayId).length;

export function savePlace(places, place) {
  const prev = place.id ? places.find((p) => p.id === place.id) : null;
  const sameDay = prev && prev.kind === 'plan' && place.kind === 'plan' && prev.dayId === place.dayId;
  const others = places.filter((p) => p.id !== place.id);

  let saved = { ...place, id: prev ? prev.id : newId('p') };
  if (saved.kind === 'plan') {
    saved.order = sameDay ? prev.order : lastOrder(others, saved.dayId) + 1;
  } else {
    saved.order = 0;
  }

  let next = prev ? places.map((p) => (p.id === saved.id ? saved : p)) : [...places, saved];
  if (prev && prev.kind === 'plan' && !sameDay) next = renumber(next, prev.dayId);
  return next;
}

export function deletePlace(places, id) {
  const target = places.find((p) => p.id === id);
  const next = places.filter((p) => p.id !== id);
  return target && target.kind === 'plan' ? renumber(next, target.dayId) : next;
}

export function directionsUrl(place) {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=transit`;
}
