// 앱 상태를 한 곳에서 관리하고 localStorage에 JSON으로 저장한다.

export const STORAGE_KEY = 'fukuoka-trip:v1';
export const SCHEMA_VERSION = 1;
const CORRUPT_PREFIX = 'fukuoka-trip:corrupt:';

export function defaultState() {
  return {
    version: SCHEMA_VERSION,
    trip: {
      title: '후쿠오카 여행',
      days: [
        { id: 'd1', date: '2026-12-31', label: '12/31(목)' },
        { id: 'd2', date: '2027-01-01', label: '1/1(금)' },
        { id: 'd3', date: '2027-01-02', label: '1/2(토)' },
        { id: 'd4', date: '2027-01-03', label: '1/3(일)' },
      ],
      fxRate: null,
    },
    people: [],
    places: [],
    checklist: [],
    transit: [],
    expenses: [],
    ui: { tab: 'map' },
  };
}

export function newId(prefix) {
  const rand = Math.random().toString(36).slice(2, 6).padEnd(4, '0');
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

function loadInitial(storage, setError) {
  if (!storage) {
    setError('storage-unavailable');
    return defaultState();
  }
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    setError('storage-unavailable');
    return defaultState();
  }
  if (raw == null) return defaultState();
  try {
    return JSON.parse(raw);
  } catch {
    // 깨진 데이터는 덮어쓰지 않고 별도 키에 보존한다.
    try { storage.setItem(CORRUPT_PREFIX + Date.now(), raw); } catch { /* 보존 실패는 무시 */ }
    setError('corrupt-data');
    return defaultState();
  }
}

export function createStore(storage) {
  const subscribers = new Set();
  const store = {
    lastError: null,
    get() {
      return structuredClone(state);
    },
    update(fn) {
      const draft = structuredClone(state);
      fn(draft);
      state = draft;
      if (storage) {
        try {
          storage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
          store.lastError = 'save-failed';
        }
      }
      for (const sub of subscribers) sub(store.get());
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
  let state = loadInitial(storage, (e) => { store.lastError = e; });
  return store;
}
