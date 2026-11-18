import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TABS, resolveTab } from '../js/router.js';

test('탭 순서는 홈/지도/준비물/교통/지출', () => {
  assert.deepEqual(TABS, ['home', 'map', 'checklist', 'transit', 'expense']);
});

test('알 수 없는 탭 값은 홈으로 돌아간다', () => {
  assert.equal(resolveTab('expense'), 'expense');
  assert.equal(resolveTab('nope'), 'home');
  assert.equal(resolveTab(undefined), 'home');
});
