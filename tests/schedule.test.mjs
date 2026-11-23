import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DAYS, STAYS, RESERVATION } from '../js/schedule/index.js';
import { DEMO_DAYS, DEMO_STAYS } from '../js/schedule/demo.js';
import { routeHtml, SCROLL_FROM, MODES } from '../js/ui/route.js';
import { THEN_LABELS } from '../js/ui/icons.js';

const DAY_KEYS = new Set(['date', 'label', 'title', 'stay', 'stops']);
const PLACE_KEYS = ['name', 'area', 'desc', 'fromStay', 'access', 'hours', 'price', 'reservation', 'reservationNote'];
const STOP_KEYS = new Set([...PLACE_KEYS, 'time', 'move', 'then', 'thenIcon']);
const MOVE_KEYS = new Set(['distance', 'total', 'choose', 'steps']);
const STEP_KEYS = new Set(['mode', 'title', 'text', 'time', 'note']);
const CAND_KEYS = new Set(PLACE_KEYS);

// 손으로 입력한 일정 데이터의 실수(오타 난 항목 이름, 빠진 이름, 잘못된 값)를 찾는다
function problems(days, stays) {
  const out = [];
  const checkPlace = (p, where, allowed) => {
    for (const k of Object.keys(p)) if (!allowed.has(k)) out.push(`${where}: 모르는 항목 '${k}'`);
    if (typeof p.name !== 'string' || !p.name.trim()) out.push(`${where}: name이 비어 있음`);
    if (p.reservation !== undefined && !(p.reservation in RESERVATION)) out.push(`${where}: reservation '${p.reservation}'은 ${Object.keys(RESERVATION).join('/')} 중 하나여야 함`);
    for (const k of PLACE_KEYS.filter((k) => k !== 'name' && k !== 'reservation')) {
      if (p[k] != null && typeof p[k] !== 'string') out.push(`${where}: ${k}는 글자여야 함`);
    }
  };
  days.forEach((d, di) => {
    const dw = `${di + 1}일차`;
    for (const k of Object.keys(d)) if (!DAY_KEYS.has(k)) out.push(`${dw}: 모르는 항목 '${k}'`);
    if (d.stay !== null && !(d.stay in stays)) out.push(`${dw}: 숙소 '${d.stay}'가 stays.js에 없음`);
    if (!Array.isArray(d.stops)) { out.push(`${dw}: stops는 목록이어야 함`); return; }
    d.stops.forEach((s, si) => {
      const sw = `${dw} ${si + 1}번째 일정(${s.name ?? '?'})`;
      checkPlace(s, sw, STOP_KEYS);
      if (s.time !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time)) out.push(`${sw}: time은 '09:30' 형식`);
      if (s.then !== undefined && !Array.isArray(s.then)) out.push(`${sw}: then은 목록이어야 함`);
      if (s.thenIcon !== undefined && !(s.thenIcon in THEN_LABELS)) out.push(`${sw}: thenIcon '${s.thenIcon}'는 ${Object.keys(THEN_LABELS).join('/')} 중 하나`);
      if (s.move !== undefined) {
        for (const k of Object.keys(s.move)) if (!MOVE_KEYS.has(k)) out.push(`${sw} 이동: 모르는 항목 '${k}'`);
        if (!Array.isArray(s.move.steps) || !s.move.steps.length) out.push(`${sw} 이동: steps가 비어 있음`);
        (s.move.steps ?? []).forEach((st, ti) => {
          const tw = `${sw} 이동 ${ti + 1}단계`;
          for (const k of Object.keys(st)) if (!STEP_KEYS.has(k)) out.push(`${tw}: 모르는 항목 '${k}'`);
          if (!(st.mode in MODES)) out.push(`${tw}: mode '${st.mode}'는 ${Object.keys(MODES).join('/')} 중 하나`);
          if (!st.title && !st.text) out.push(`${tw}: title이나 text가 비어 있음`);
        });
      }
      (s.then ?? []).forEach((c, ci) => checkPlace(c, `${sw} 후보 ${ci + 1}(${c.name ?? '?'})`, CAND_KEYS));
    });
  });
  return out;
}

test('일정은 12/31(목)부터 1/4(월)까지 5일', () => {
  assert.deepEqual(DAYS.map((d) => d.date), ['2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04']);
});

test('숙소: 1·2일차 같은 곳, 3일차 료칸, 4일차 다른 곳, 5일차 없음', () => {
  assert.deepEqual(DAYS.map((d) => d.stay), ['hotelA', 'hotelA', 'ryokan', 'hotelB', null]);
});

test('일정 데이터에 입력 실수가 없다', () => {
  assert.deepEqual(problems(DAYS, STAYS), []);
});

test('예시 데이터에도 입력 실수가 없다', () => {
  assert.deepEqual(problems(DEMO_DAYS, DEMO_STAYS), []);
  assert.equal(DEMO_DAYS.length, DAYS.length);
});

test('검사기는 오타와 빠진 값을 잡는다', () => {
  const bad = [{ date: 'x', label: 'x', stay: 'nope', stops: [
    { name: '', resevation: 'done', time: '9:00', then: [{ name: 'A', reservation: 'yes' }] },
  ] }];
  bad[0].stops.push({ name: 'B', move: { steps: [{ mode: 'car' }] } });
  const p = problems(bad, {});
  assert.ok(p.some((m) => m.includes("mode 'car'")));
  assert.ok(p.some((m) => m.includes('title이나 text')));
  assert.ok(p.some((m) => m.includes("숙소 'nope'")));
  assert.ok(p.some((m) => m.includes("모르는 항목 'resevation'")));
  assert.ok(p.some((m) => m.includes('name이 비어')));
  assert.ok(p.some((m) => m.includes('time은')));
  assert.ok(p.some((m) => m.includes("reservation 'yes'")));
});

test('노선: 후보가 있는 일정 뒤에만 사이 구간이 생긴다', () => {
  const html = routeHtml([{ name: 'A', then: [{ name: 'a1' }] }, { name: 'B' }, { name: 'C', then: [] }]);
  assert.equal(html.match(/class="stop"/g).length, 3);
  assert.equal(html.match(/class="gap"/g).length, 1);
  assert.match(html, /이 사이 후보 <b>1<\/b>곳/);
});

test(`노선: 후보가 ${SCROLL_FROM}곳 이상일 때만 목록에 따로 스크롤`, () => {
  const many = Array.from({ length: SCROLL_FROM }, (_, i) => ({ name: `c${i}` }));
  assert.match(routeHtml([{ name: 'A', then: many }]), /class="gap-box cands gap-scroll"/);
  assert.match(routeHtml([{ name: 'A', then: many.slice(1) }]), /class="gap-box cands"/);
});

test('노선: 글자는 HTML로 해석되지 않는다', () => {
  assert.match(routeHtml([{ name: '<b>x</b>' }]), /&lt;b&gt;x&lt;\/b&gt;/);
});

test('노선: 예약 값을 적지 않으면 예약 줄을 숨기고, none이면 예약 없음', () => {
  assert.doesNotMatch(routeHtml([{ name: 'A', area: '하카타' }]), /badge/);
  assert.doesNotMatch(routeHtml([{ name: 'A' }]), /class="info"/);
  assert.match(routeHtml([{ name: 'A', reservation: 'none' }]), /badge-none">예약 없음/);
  assert.match(routeHtml([{ name: 'A', reservation: 'ok' }]), /badge-ok">예약 가능/);
  assert.match(routeHtml([{ name: 'A', reservationNote: '18시' }]), /badge-none/);
});

test('일정이 비어 있으면 안내 문구', () => {
  assert.match(routeHtml([]), /아직 일정이 없습니다/);
});

test('노선: 이동 카드는 일정 바로 뒤, 후보 구간보다 앞에 온다', () => {
  const html = routeHtml([
    { name: 'A', move: { total: '약 30분', steps: [{ mode: 'subway', text: '지하철로 Y역까지', time: '8분' }] }, then: [{ name: 'a1' }] },
    { name: 'B' },
  ]);
  const order = [...html.matchAll(/class="(stop|gap gap-move|gap)"/g)].map((m) => m[1]);
  assert.deepEqual(order, ['stop', 'gap gap-move', 'gap', 'stop']);
  assert.match(html, /flow-step mode-subway/);
  assert.match(html, /이동 <b>약 30분<\/b>/);
  assert.match(html, /gap-box gap-scroll"><ol class="flow"/); // 이동은 항상 높이 제한 + 스크롤
});

test('이동 단계: 제목을 생략하면 수단 이름이 제목, 제목·설명·시간 순서로 보인다', () => {
  const html = routeHtml([{ name: 'A', move: { steps: [
    { mode: 'walk', text: '역까지', time: '5분' },
    { mode: 'procedure', title: '입국 수속', text: '입국 심사' },
  ] } }]);
  assert.match(html, /<b>도보 이동<\/b><span class="flow-time">5분<\/span>/);
  assert.match(html, /mode-procedure[\s\S]*<b>입국 수속<\/b>[\s\S]*flow-text">입국 심사/);
});

test('이동 choose: 방법 사이에 또는, 순서용 흐름이 아님', () => {
  const html = routeHtml([{ name: 'A', move: { choose: true, steps: [{ mode: 'walk' }, { mode: 'bus' }, { mode: 'subway' }] } }]);
  assert.equal(html.match(/flow-or/g).length, 2);
  assert.match(html, /class="flow flow-choose"/);
  assert.doesNotMatch(routeHtml([{ name: 'A', move: { steps: [{ mode: 'walk' }, { mode: 'bus' }] } }]), /flow-or/);
});

test('이동 접힌 줄: 거리 · 총 시간', () => {
  const html = routeHtml([{ name: 'A', move: { distance: '5.3km', total: '약 1시간', steps: [{ mode: 'walk' }] } }]);
  assert.match(html, /이동 <b>5\.3km · 약 1시간<\/b>/);
  assert.match(routeHtml([{ name: 'A', move: { steps: [{ mode: 'walk' }] } }]), /<span>이동<\/span>/);
});

test('후보 구간 아이콘: 0곳이어도 구간이 생기고 이름이 바뀐다', () => {
  const html = routeHtml([{ name: 'A', thenIcon: 'food', then: [] }, { name: 'B' }]);
  assert.match(html, /class="gap"/);
  assert.match(html, /gap-icon"><svg/);
  assert.match(html, /먹을 곳 <span class="gap-none">· 아직 없음/);
  assert.match(html, /아직 후보가 없습니다/);
  assert.match(routeHtml([{ name: 'A', thenIcon: 'food', then: [{ name: 'x' }] }]), /먹을 곳 <b>1<\/b>곳/);
});

test('이동 구간은 자동차 아이콘', () => {
  assert.match(routeHtml([{ name: 'A', move: { steps: [{ mode: 'walk' }] } }]), /gap-move[\s\S]*gap-icon"><svg/);
});

test('일정 카드: 세부 정보가 있으면 눌러서 펼치는 카드, 없으면 그냥 카드', () => {
  const rich = routeHtml([{ name: 'A', hours: '23시까지', price: '2,000엔', reservation: 'no' }]);
  assert.match(rich, /class="stop stop-fold" data-fold/);
  assert.match(rich, /stop-detail gap-scroll/);
  assert.match(rich, /영업<\/dt><dd>23시까지/);
  assert.match(rich, /badge-no">예약 불가/);
  assert.doesNotMatch(routeHtml([{ name: 'B', desc: '체크인' }]), /data-fold/);
});
