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

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// 저장된 데이터를 현재 스키마로 맞춘다. 버전이 올라가면 여기에 단계별 변환을 추가한다.
function migrate(data) {
  const base = defaultState();
  const out = { ...base, ...data, version: SCHEMA_VERSION };
  for (const key of ['people', 'places', 'checklist', 'transit', 'expenses']) {
    if (!Array.isArray(out[key])) out[key] = [];
  }
  out.trip = isObject(data.trip) ? { ...base.trip, ...data.trip } : base.trip;
  if (!Array.isArray(out.trip.days) || out.trip.days.length === 0) out.trip.days = base.trip.days;
  out.ui = isObject(data.ui) ? { ...base.ui, ...data.ui } : base.ui;
  return out;
}

// 반환: { state, error, readOnly } — readOnly이면 기존 데이터를 지키기 위해 저장하지 않는다.
function loadInitial(storage) {
  if (!storage) return { state: defaultState(), error: 'storage-unavailable', readOnly: false };
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: defaultState(), error: 'storage-unavailable', readOnly: false };
  }
  if (raw == null) return { state: defaultState(), error: null, readOnly: false };

  let parsed;
  try { parsed = JSON.parse(raw); } catch { parsed = undefined; }

  if (!isObject(parsed)) {
    // 깨진 데이터는 별도 키에 보존한다. 보존에 실패하면 원래 키도 덮어쓰지 않는다.
    try {
      storage.setItem(CORRUPT_PREFIX + Date.now(), raw);
      return { state: defaultState(), error: 'corrupt-data', readOnly: false };
    } catch {
      return { state: defaultState(), error: 'corrupt-unsaved', readOnly: true };
    }
  }
  if (typeof parsed.version === 'number' && parsed.version > SCHEMA_VERSION) {
    return { state: migrate(parsed), error: 'newer-version', readOnly: true };
  }
  return { state: migrate(parsed), error: null, readOnly: false };
}

export function createStore(storage) {
  const subscribers = new Set();
  const loaded = loadInitial(storage);
  let state = loaded.state;
  const writable = storage && !loaded.readOnly;
  const store = {
    lastError: loaded.error,
    get() {
      return structuredClone(state);
    },
    update(fn) {
      const draft = structuredClone(state);
      fn(draft);
      state = draft;
      if (writable) {
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
  return store;
}
