import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY_COLORS, MAP_FILTERS, hasCoords, routeForDay, visibleLayers, SAMPLE_PLACES,
} from '../js/map/model.js';

const plan = (id, dayId, order, extra = {}) => ({ id, name: id, kind: 'plan', dayId, order, lat: 33.59, lng: 130.4, ...extra });
const cand = (id, extra = {}) => ({ id, name: id, kind: 'candidate', dayId: null, lat: 33.6, lng: 130.41, ...extra });
const stay = (id, stayDayIds, extra = {}) => ({ id, name: id, kind: 'stay', stayDayIds, lat: 33.59, lng: 130.42, ...extra });

test('일차 색 4개와 필터 목록', () => {
  assert.deepEqual(Object.keys(DAY_COLORS), ['d1', 'd2', 'd3', 'd4']);
  assert.deepEqual(MAP_FILTERS, ['all', 'd1', 'd2', 'd3', 'd4', 'candidates']);
});

test('좌표 검사: 숫자가 아니거나 범위 밖이면 false', () => {
  assert.equal(hasCoords({ lat: 33.5, lng: 130.4 }), true);
  assert.equal(hasCoords({ lat: '33.5', lng: 130.4 }), false);
  assert.equal(hasCoords({ lat: null, lng: 130.4 }), false);
  assert.equal(hasCoords({ lat: NaN, lng: 130.4 }), false);
  assert.equal(hasCoords({ lat: 95, lng: 130.4 }), false);
  assert.equal(hasCoords({}), false);
});

test('routeForDay: 해당 일차 plan만, order 오름차순, 좌표 없는 장소 제외', () => {
  const places = [
    plan('c', 'd1', 3), plan('a', 'd1', 1), plan('b', 'd1', 2, { lat: undefined }),
    plan('x', 'd2', 1), cand('k'), stay('s', []),
  ];
  assert.deepEqual(routeForDay(places, 'd1').map((p) => p.id), ['a', 'c']);
});

test('all: 4일차 경로 + 후보 + 숙소 전부', () => {
  const places = [plan('a', 'd1', 1), plan('b', 'd3', 1), cand('k'), stay('s1', ['d1']), stay('s2', [])];
  const v = visibleLayers(places, 'all');
  assert.deepEqual(v.routes.map((r) => r.dayId), ['d1', 'd2', 'd3', 'd4']);
  assert.equal(v.routes[0].color, DAY_COLORS.d1);
  assert.deepEqual(v.routes[1].places, []);
  assert.deepEqual(v.candidates.map((p) => p.id), ['k']);
  assert.deepEqual(v.stays.map((p) => p.id), ['s1', 's2']);
});

test('일차 필터: 그 일차 경로 + 후보 + 그 날 숙소(빈 배열이면 매일)', () => {
  const places = [plan('a', 'd2', 1), plan('b', 'd1', 1), cand('k'), stay('s1', ['d1']), stay('s2', ['d2', 'd3']), stay('s3', [])];
  const v = visibleLayers(places, 'd2');
  assert.deepEqual(v.routes.map((r) => r.dayId), ['d2']);
  assert.deepEqual(v.routes[0].places.map((p) => p.id), ['a']);
  assert.deepEqual(v.candidates.map((p) => p.id), ['k']);
  assert.deepEqual(v.stays.map((p) => p.id), ['s2', 's3']);
});

test('후보 필터: 경로 없음, 후보 + 숙소 전부', () => {
  const v = visibleLayers([plan('a', 'd1', 1), cand('k'), stay('s', ['d4'])], 'candidates');
  assert.deepEqual(v.routes, []);
  assert.deepEqual(v.candidates.map((p) => p.id), ['k']);
  assert.deepEqual(v.stays.map((p) => p.id), ['s']);
});

test('알 수 없는 필터는 all로 처리', () => {
  const v = visibleLayers([plan('a', 'd1', 1)], 'weird');
  assert.equal(v.routes.length, 4);
});

test('좌표 없는 후보·숙소도 제외', () => {
  const v = visibleLayers([cand('k', { lat: null }), stay('s', [], { lng: 'x' })], 'all');
  assert.deepEqual(v.candidates, []);
  assert.deepEqual(v.stays, []);
});

test('예시 장소: 모든 일차에 경로가 있고 좌표가 후쿠오카 근처', () => {
  for (const d of ['d1', 'd2', 'd3', 'd4']) assert.ok(routeForDay(SAMPLE_PLACES, d).length >= 1, d);
  for (const p of SAMPLE_PLACES) {
    assert.ok(hasCoords(p), p.name);
    assert.ok(p.lat > 33.4 && p.lat < 33.7 && p.lng > 130.2 && p.lng < 130.6, p.name);
  }
});
