import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, defaultState, newId, STORAGE_KEY, SCHEMA_VERSION } from '../js/store.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => { data.set(k, String(v)); },
    removeItem: (k) => { data.delete(k); },
    key: (i) => [...data.keys()][i] ?? null,
    get length() { return data.size; },
    _data: data,
  };
}

test('저장된 값이 없으면 기본 상태', () => {
  const store = createStore(memoryStorage());
  assert.deepEqual(store.get(), defaultState());
  assert.equal(store.get().version, SCHEMA_VERSION);
  assert.equal(store.get().trip.days.length, 4);
  assert.equal(store.get().trip.days[0].date, '2026-12-31');
  assert.equal(store.get().trip.days[3].label, '1/3(일)');
  assert.equal(store.get().ui.tab, 'map');
});

test('update 결과가 저장되고 다시 읽힌다', () => {
  const storage = memoryStorage();
  createStore(storage).update((d) => { d.ui.tab = 'expense'; });
  assert.equal(createStore(storage).get().ui.tab, 'expense');
});

test('get은 내부 상태를 직접 노출하지 않는다', () => {
  const store = createStore(memoryStorage());
  store.get().ui.tab = 'hacked';
  assert.equal(store.get().ui.tab, 'map');
});

test('구독자에게 알리고 해제할 수 있다', () => {
  const store = createStore(memoryStorage());
  let calls = 0;
  const off = store.subscribe(() => { calls++; });
  store.update((d) => { d.ui.tab = 'transit'; });
  assert.equal(calls, 1);
  off();
  store.update((d) => { d.ui.tab = 'map'; });
  assert.equal(calls, 1);
});

test('깨진 JSON은 보존하고 기본값으로 시작', () => {
  const storage = memoryStorage({ [STORAGE_KEY]: '{oops' });
  const store = createStore(storage);
  assert.deepEqual(store.get(), defaultState());
  const corruptKeys = [...storage._data.keys()].filter((k) => k.startsWith('fukuoka-trip:corrupt:'));
  assert.equal(corruptKeys.length, 1);
  assert.equal(storage.getItem(corruptKeys[0]), '{oops');
  assert.equal(storage.getItem(STORAGE_KEY), '{oops');
});

test('storage가 null이어도 동작', () => {
  const store = createStore(null);
  store.update((d) => { d.ui.tab = 'checklist'; });
  assert.equal(store.get().ui.tab, 'checklist');
  assert.equal(store.lastError, 'storage-unavailable');
});

test('setItem이 예외를 던지면 lastError 기록', () => {
  const storage = memoryStorage();
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  const store = createStore(storage);
  store.update((d) => { d.ui.tab = 'transit'; });
  assert.equal(store.get().ui.tab, 'transit');
  assert.equal(store.lastError, 'save-failed');
});

test('newId는 접두사와 고유값', () => {
  assert.match(newId('p'), /^p_/);
  const ids = new Set(Array.from({ length: 100 }, () => newId('p')));
  assert.equal(ids.size, 100);
});
