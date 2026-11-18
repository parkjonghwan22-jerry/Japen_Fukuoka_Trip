import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePlace, savePlace, deletePlace, directionsUrl, CATEGORIES, KINDS } from '../js/places.js';

const base = { name: '하카타역', kind: 'plan', dayId: 'd1', lat: 33.5897, lng: 130.4207 };
const ok = (input) => {
  const r = validatePlace(input);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  return r.place;
};
const P = (id, dayId, order, kind = 'plan') => ({ id, name: id, kind, dayId, order, lat: 33.59, lng: 130.4 });

test('선택지 목록', () => {
  assert.deepEqual(KINDS, ['plan', 'candidate', 'stay']);
  assert.deepEqual(CATEGORIES, ['맛집', '카페', '쇼핑', '관광', '기타']);
});

test('문자열 좌표·순서는 숫자로, 빈 문자열은 null, 이름 공백 제거', () => {
  const p = ok({ ...base, name: '  하카타역 ', lat: '33.5897', lng: '130.4207', order: '2', time: '', memo: '' });
  assert.equal(p.name, '하카타역');
  assert.equal(p.lat, 33.5897);
  assert.equal(p.lng, 130.4207);
  assert.equal(p.order, 2);
  assert.equal(p.time, null);
  assert.equal(p.memo, null);
  assert.equal(p.newYearOpen, 'unknown');
});

test('이름 빈칸이면 오류', () => {
  const r = validatePlace({ ...base, name: '   ' });
  assert.equal(r.ok, false);
  assert.ok(r.errors.name);
});

test('좌표 없음·빈 문자열·(0,0)이면 오류', () => {
  for (const c of [{ lat: '', lng: '' }, { lat: null, lng: 130 }, { lat: 0, lng: 0 }, { lat: 'abc', lng: 130 }]) {
    const r = validatePlace({ ...base, ...c });
    assert.equal(r.ok, false, JSON.stringify(c));
    assert.ok(r.errors.location, JSON.stringify(c));
  }
});

test('일정인데 일차가 없으면 오류, 후보·숙소는 일차를 지운다', () => {
  assert.ok(validatePlace({ ...base, dayId: '' }).errors.dayId);
  assert.ok(validatePlace({ ...base, dayId: 'd9' }).errors.dayId);
  assert.equal(ok({ ...base, kind: 'candidate', dayId: 'd2' }).dayId, null);
  assert.equal(ok({ ...base, kind: 'stay', dayId: 'd2' }).dayId, null);
});

test('숙소의 묵는 날은 유효한 일차만 남기고, 숙소가 아니면 빈 배열', () => {
  assert.deepEqual(ok({ ...base, kind: 'stay', stayDayIds: ['d1', 'd9', 'd3'] }).stayDayIds, ['d1', 'd3']);
  assert.deepEqual(ok({ ...base, stayDayIds: ['d1'] }).stayDayIds, []);
});

test('잘못된 카테고리·머무는 시간·연말연시 값은 기본값으로', () => {
  const p = ok({ ...base, category: '해킹', stayMinutes: 'x', newYearOpen: 'maybe' });
  assert.equal(p.category, '기타');
  assert.equal(p.stayMinutes, null);
  assert.equal(p.newYearOpen, 'unknown');
  assert.equal(ok({ ...base, stayMinutes: '90' }).stayMinutes, 90);
});

test('새 일정 장소는 id를 받고 그 일차 맨 뒤 순서', () => {
  const places = [P('a', 'd1', 1), P('b', 'd1', 2), P('c', 'd2', 1)];
  const next = savePlace(places, ok(base));
  const added = next.find((p) => !['a', 'b', 'c'].includes(p.id));
  assert.match(added.id, /^p_/);
  assert.equal(added.order, 3);
  assert.equal(places.length, 3, '원본 배열은 바뀌지 않는다');
});

test('수정: 같은 일차면 순서 유지', () => {
  const places = [P('a', 'd1', 1), P('b', 'd1', 2)];
  const next = savePlace(places, { ...places[0], name: '새 이름' });
  assert.equal(next.find((p) => p.id === 'a').name, '새 이름');
  assert.equal(next.find((p) => p.id === 'a').order, 1);
});

test('수정: 다른 일차로 옮기면 새 일차 맨 뒤, 이전 일차는 빈틈 없이', () => {
  const places = [P('a', 'd1', 1), P('b', 'd1', 2), P('c', 'd1', 3), P('x', 'd2', 1)];
  const next = savePlace(places, { ...places[1], dayId: 'd2' });
  const order = (id) => next.find((p) => p.id === id).order;
  assert.deepEqual([order('a'), order('c')], [1, 2]);
  assert.equal(order('b'), 2);
  assert.equal(next.find((p) => p.id === 'b').dayId, 'd2');
});

test('수정: 일정→후보로 바꾸면 이전 일차 재정렬, order는 0', () => {
  const places = [P('a', 'd1', 1), P('b', 'd1', 2), P('c', 'd1', 3)];
  const next = savePlace(places, { ...places[0], kind: 'candidate', dayId: null });
  assert.equal(next.find((p) => p.id === 'a').order, 0);
  assert.deepEqual(['b', 'c'].map((id) => next.find((p) => p.id === id).order), [1, 2]);
});

test('삭제 후 그 일차 순서 재정렬', () => {
  const places = [P('a', 'd1', 1), P('b', 'd1', 2), P('c', 'd1', 3), P('k', null, 0, 'candidate')];
  const next = deletePlace(places, 'b');
  assert.deepEqual(next.map((p) => p.id), ['a', 'c', 'k']);
  assert.equal(next.find((p) => p.id === 'c').order, 2);
});

test('길찾기 링크: 좌표 목적지, 대중교통', () => {
  assert.equal(
    directionsUrl({ lat: 33.5897, lng: 130.4207 }),
    'https://www.google.com/maps/dir/?api=1&destination=33.5897,130.4207&travelmode=transit',
  );
});
