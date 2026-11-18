// 지도에 무엇을 그릴지 고르는 순수 로직 (화면 코드와 분리해 테스트한다)

export const DAY_COLORS = { d1: '#2f6fde', d2: '#e8590c', d3: '#2b9348', d4: '#9c36b5' };
export const CANDIDATE_COLOR = '#868e96';
export const STAY_COLOR = '#191f28';
export const MAP_FILTERS = ['all', 'd1', 'd2', 'd3', 'd4', 'candidates'];
const DAY_IDS = Object.keys(DAY_COLORS);

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export function hasCoords(p) {
  return !!p && isNum(p.lat) && isNum(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
}

export function routeForDay(places, dayId) {
  return places
    .filter((p) => p.kind === 'plan' && p.dayId === dayId && hasCoords(p))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

const staysOn = (dayId) => (p) =>
  !Array.isArray(p.stayDayIds) || p.stayDayIds.length === 0 || p.stayDayIds.includes(dayId);

export function visibleLayers(places, filter) {
  const f = MAP_FILTERS.includes(filter) ? filter : 'all';
  const candidates = places.filter((p) => p.kind === 'candidate' && hasCoords(p));
  const allStays = places.filter((p) => p.kind === 'stay' && hasCoords(p));
  const route = (dayId) => ({ dayId, color: DAY_COLORS[dayId], places: routeForDay(places, dayId) });

  if (f === 'candidates') return { routes: [], candidates, stays: allStays };
  if (f === 'all') return { routes: DAY_IDS.map(route), candidates, stays: allStays };
  return { routes: [route(f)], candidates, stays: allStays.filter(staysOn(f)) };
}

// 실제 장소가 하나도 없을 때만 보여주는 예시(저장하지 않음). 좌표는 대략값.
const s = (id, name, kind, dayId, order, lat, lng, time = '') =>
  ({ id: 'sample_' + id, name, kind, dayId, order, lat, lng, time, stayDayIds: [] });

export const SAMPLE_PLACES = [
  s('1', '후쿠오카 공항', 'plan', 'd1', 1, 33.5859, 130.4510, '19:30'),
  s('2', '하카타역', 'plan', 'd1', 2, 33.5897, 130.4207, '20:30'),
  s('3', '나카스 포장마차 거리', 'plan', 'd1', 3, 33.5925, 130.4057, '21:30'),
  s('4', '다자이후 텐만구', 'plan', 'd2', 1, 33.5215, 130.5349, '10:00'),
  s('5', '캐널시티 하카타', 'plan', 'd2', 2, 33.5898, 130.4111, '16:00'),
  s('6', '오호리 공원', 'plan', 'd3', 1, 33.5859, 130.3765, '10:00'),
  s('7', '후쿠오카 타워', 'plan', 'd3', 2, 33.5933, 130.3515, '13:00'),
  s('8', '텐진 쇼핑가', 'plan', 'd3', 3, 33.5911, 130.3990, '16:00'),
  s('9', '쿠시다 신사', 'plan', 'd4', 1, 33.5930, 130.4103, '10:00'),
  s('10', '후쿠오카 공항', 'plan', 'd4', 2, 33.5859, 130.4510, '15:00'),
  s('11', '라멘집 (후보 예시)', 'candidate', null, 0, 33.5929, 130.4048),
  s('12', '카페 (후보 예시)', 'candidate', null, 0, 33.5880, 130.3960),
  s('13', '숙소 (예시)', 'stay', null, 0, 33.5915, 130.4180),
];
