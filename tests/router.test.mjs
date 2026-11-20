import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TABS, resolveTab } from '../js/router.js';

test('탭은 홈/일정 두 개', () => {
  assert.deepEqual(TABS, ['home', 'schedule']);
});

test('알 수 없는 탭 값은 홈으로 돌아간다', () => {
  assert.equal(resolveTab('schedule'), 'schedule');
  assert.equal(resolveTab('nope'), 'home');
  assert.equal(resolveTab('map'), 'home'); // 없어진 탭
  assert.equal(resolveTab(undefined), 'home');
});
