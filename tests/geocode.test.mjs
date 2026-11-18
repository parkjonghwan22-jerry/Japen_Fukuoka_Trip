import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNominatim, searchUrl } from '../js/geocode.js';

test('Nominatim 결과를 이름·주소·숫자 좌표로', () => {
  const json = [
    { name: '博多駅', display_name: '博多駅, 博多区, 福岡市, 日本', lat: '33.5897', lon: '130.4207' },
    { name: '', display_name: 'キャナルシティ博多, 住吉, 博多区', lat: '33.5898', lon: '130.4111' },
  ];
  assert.deepEqual(parseNominatim(json), [
    { name: '博多駅', address: '博多区, 福岡市, 日本', lat: 33.5897, lng: 130.4207 },
    { name: 'キャナルシティ博多', address: '住吉, 博多区', lat: 33.5898, lng: 130.4111 },
  ]);
});

test('좌표가 이상한 항목은 버리고, 배열이 아니면 빈 결과', () => {
  assert.deepEqual(parseNominatim([{ name: 'x', display_name: 'x', lat: 'abc', lon: '1' }]), []);
  assert.deepEqual(parseNominatim(null), []);
  assert.deepEqual(parseNominatim({ error: 'x' }), []);
});

test('검색 주소: 후쿠오카 주변 우선, 언어, 결과 수 제한', () => {
  const u = new URL(searchUrl('이치란 본점'));
  assert.equal(u.origin + u.pathname, 'https://nominatim.openstreetmap.org/search');
  assert.equal(u.searchParams.get('q'), '이치란 본점');
  assert.equal(u.searchParams.get('format'), 'jsonv2');
  assert.equal(u.searchParams.get('accept-language'), 'ko,ja,en');
  assert.equal(u.searchParams.get('limit'), '8');
  assert.ok(u.searchParams.get('viewbox'));
});
