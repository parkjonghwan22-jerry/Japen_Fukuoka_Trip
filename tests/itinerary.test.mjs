import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daySections, candidateItems, moveInDay, addToDay, timeWarnings } from '../js/itinerary.js';
import { DAY_COLORS } from '../js/map/model.js';

const days = [
  { id: 'd1', label: '12/31(목)' }, { id: 'd2', label: '1/1(금)' },
  { id: 'd3', label: '1/2(토)' }, { id: 'd4', label: '1/3(일)' },
];
const P = (id, dayId, order, extra = {}) => ({ id, name: id, kind: 'plan', dayId, order, lat: 33.59, lng: 130.4, ...extra });
const C = (id, extra = {}) => ({ id, name: id, kind: 'candidate', dayId: null, order: 0, lat: 33.6, lng: 130.41, ...extra });
const S = (id, stayDayIds) => ({ id, name: id, kind: 'stay', dayId: null, order: 0, stayDayIds, lat: 33.59, lng: 130.42 });
const orderOf = (list, id) => list.find((p) => p.id === id).order;

test('일차 필터: 그 일차 일정(순서대로)과 그 날 숙소', () => {
  const places = [P('b', 'd1', 2), P('a', 'd1', 1), P('x', 'd2', 1), S('s1', ['d1']), S('s2', ['d2'])];
  const [sec, ...rest] = daySections(places, days, 'd1');
  assert.equal(rest.length, 0);
  assert.equal(sec.dayId, 'd1');
  assert.equal(sec.label, '12/31(목)');
  assert.equal(sec.color, DAY_COLORS.d1);
  assert.deepEqual(sec.items.map((p) => p.id), ['a', 'b']);
  assert.deepEqual(sec.stays.map((p) => p.id), ['s1']);
});

test('전체: 4개 일차 묶음, 후보 필터는 빈 배열', () => {
  const places = [P('a', 'd3', 1)];
  const all = daySections(places, days, 'all');
  assert.deepEqual(all.map((s) => s.dayId), ['d1', 'd2', 'd3', 'd4']);
  assert.deepEqual(all[2].items.map((p) => p.id), ['a']);
  assert.deepEqual(daySections(places, days, 'candidates'), []);
});

test('후보 목록: 후보와 일차 없는 일정, 이름순', () => {
  const places = [C('카페'), P('라멘', null, 0), C('가게'), P('x', 'd1', 1)];
  assert.deepEqual(candidateItems(places).map((p) => p.id), ['가게', '라멘', '카페']);
});

test('순서 위/아래로 이동', () => {
  const places = [P('a', 'd1', 1), P('b', 'd1', 2), P('c', 'd1', 3), P('x', 'd2', 1)];
  const up = moveInDay(places, 'c', -1);
  assert.deepEqual(['a', 'b', 'c'].map((id) => orderOf(up, id)), [1, 3, 2]);
  const down = moveInDay(places, 'a', 1);
  assert.deepEqual(['a', 'b', 'c'].map((id) => orderOf(down, id)), [2, 1, 3]);
  assert.equal(orderOf(up, 'x'), 1);
});

test('맨 위에서 위로, 맨 아래에서 아래로는 변화 없음', () => {
  const places = [P('a', 'd1', 1), P('b', 'd1', 2)];
  assert.deepEqual(moveInDay(places, 'a', -1), places);
  assert.deepEqual(moveInDay(places, 'b', 1), places);
  assert.deepEqual(moveInDay(places, 'nope', 1), places);
});

test('빈틈·중복 순서도 이동 후 1,2,3 연속', () => {
  const places = [P('a', 'd1', 1), P('b', 'd1', 3), P('c', 'd1', 3)];
  const next = moveInDay(places, 'a', 1);
  assert.deepEqual(next.filter((p) => p.dayId === 'd1').map((p) => p.order).sort(), [1, 2, 3]);
  assert.equal(orderOf(next, 'a'), 2);
});

test('후보를 일정에 넣으면 그 일차 맨 뒤', () => {
  const places = [P('a', 'd2', 1), P('b', 'd2', 4), C('k')];
  const next = addToDay(places, 'k', 'd2');
  const k = next.find((p) => p.id === 'k');
  assert.equal(k.kind, 'plan');
  assert.equal(k.dayId, 'd2');
  assert.equal(k.order, 5);
});

test('일차 없는 일정도 일정에 넣을 수 있다, 없는 id나 잘못된 일차는 변화 없음', () => {
  const places = [P('n', null, 0), P('a', 'd1', 1)];
  assert.equal(addToDay(places, 'n', 'd1').find((p) => p.id === 'n').order, 2);
  assert.deepEqual(addToDay(places, 'zzz', 'd1'), places);
  assert.deepEqual(addToDay(places, 'n', 'd9'), places);
});

test('시간 경고: 앞 항목보다 이른 시간, 시간 없는 항목은 건너뜀', () => {
  const items = [
    P('a', 'd1', 1, { time: '10:00' }), P('b', 'd1', 2, { time: null }),
    P('c', 'd1', 3, { time: '09:30' }), P('d', 'd1', 4, { time: '12:00' }),
  ];
  assert.deepEqual([...timeWarnings(items)], ['c']);
  assert.equal(timeWarnings([P('a', 'd1', 1)]).size, 0);
});
