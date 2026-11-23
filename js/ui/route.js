// 일차 상세의 노선(핵심 일정 점 + 점 사이 이동·후보 목록)을 HTML 문자열로 만든다. DOM 없이 테스트할 수 있다.
import { esc } from './dom.js';
import { RESERVATION } from '../schedule/index.js';
import { ICONS, THEN_LABELS } from './icons.js';

// 후보가 이 개수 이상이면 후보 목록에 따로 스크롤을 준다
export const SCROLL_FROM = 5;

const resvKey = (p) => (RESERVATION[p.reservation] ? p.reservation : 'none');

function infoHtml(p) {
  const rows = [];
  if (p.area) rows.push(['위치', esc(p.area)]);
  if (p.fromStay) rows.push(['숙소에서', esc(p.fromStay)]);
  if (p.access) rows.push(['가는 법', esc(p.access)]);
  if (p.hours) rows.push(['영업', esc(p.hours)]);
  if (p.price) rows.push(['가격', esc(p.price)]);
  if (p.menu) rows.push(['먹거리', esc(p.menu)]);
  if (p.see) rows.push(['볼거리', esc(p.see)]);
  if (p.tips) rows.push(['참고', esc(p.tips)]);
  // 예약 값을 적지 않았으면 예약 줄을 숨긴다 (모르는 것을 '예약 없음'으로 보이지 않게)
  if (p.reservation !== undefined || p.reservationNote) {
    const key = resvKey(p);
    rows.push(['예약', `<span class="badge badge-${key}">${RESERVATION[key]}</span>`
      + (p.reservationNote ? ` <span class="resv-note">${esc(p.reservationNote)}</span>` : '')]);
  }
  if (!rows.length) return '';
  return `<dl class="info">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}

const descHtml = (p) => (p.desc ? `<p class="desc">${esc(p.desc)}</p>` : '');

// 핵심 일정 카드. 세부 정보(위치·영업·가격·예약 등)가 있으면 카드를 눌러 아래로 펼친다 (높이 제한 + 따로 스크롤).
function stopHtml(s, i) {
  const head = `
        ${s.time ? `<p class="stop-time">${esc(s.time)}</p>` : ''}
        <h3 class="stop-name">${esc(s.name)}</h3>
        ${descHtml(s)}`;
  const info = infoHtml(s);
  if (!info) {
    return `
    <li class="stop">
      <span class="stop-dot" aria-hidden="true"></span>
      <article class="stop-card">${head}</article>
    </li>`;
  }
  const id = `stop-${i}`;
  return `
    <li class="stop stop-fold" data-fold>
      <span class="stop-dot" aria-hidden="true"></span>
      <article class="stop-card">
        <button type="button" class="stop-head" data-fold-toggle aria-expanded="false" aria-controls="${id}">
          <span class="stop-head-text">${head}</span>
          <span class="chev" aria-hidden="true"></span>
        </button>
        <div class="fold-panel" id="${id}">
          <div class="gap-clip">
            <div class="stop-detail gap-scroll">${info}</div>
          </div>
        </div>
      </article>
    </li>`;
}

// 이동 수단 (흐름 속 작은 점 색으로 구분). 단계에 title이 없으면 이 이름을 제목으로 쓴다.
export const MODES = {
  procedure: '수속', walk: '도보 이동', bus: '버스', shuttle: '셔틀버스',
  subway: '지하철', train: '전철', taxi: '택시',
};

// 이동: 점 사이에 '이동 · 약 30분'만 보이고, 누르면 가는 흐름이 펼쳐진다.
// choose: true 이면 단계가 순서가 아니라 고를 수 있는 방법들 ('또는'으로 구분)
function moveHtml(m, gi) {
  const id = `move-${gi}`;
  const flow = m.steps.map((st) => {
    const mode = MODES[st.mode] ? st.mode : 'walk';
    return `
    <li class="flow-step mode-${mode}">
      <p class="flow-title"><b>${esc(st.title || MODES[mode])}</b>${st.time ? `<span class="flow-time">${esc(st.time)}</span>` : ''}</p>
      ${st.text ? `<p class="flow-text">${esc(st.text)}</p>` : ''}
      ${st.note ? `<p class="flow-note">${esc(st.note)}</p>` : ''}
    </li>`;
  }).join(m.choose ? '<li class="flow-or" aria-hidden="true">또는</li>' : '');
  return `
    <li class="gap gap-move" data-fold>
      <button type="button" class="gap-toggle" data-fold-toggle aria-expanded="false" aria-controls="${id}">
        <span class="gap-icon">${ICONS.car}</span>
        <span>이동${[m.distance, m.total].some(Boolean) ? ` <b>${[m.distance, m.total].filter(Boolean).map(esc).join(' · ')}</b>` : ''}</span>
        <span class="chev" aria-hidden="true"></span>
      </button>
      <div class="gap-panel fold-panel" id="${id}">
        <div class="gap-clip">
          <div class="gap-box gap-scroll">${m.choose ? '<p class="flow-hint">이 중 하나로 이동</p>' : ''}<ol class="flow${m.choose ? ' flow-choose' : ''}">${flow}</ol></div>
        </div>
      </div>
    </li>`;
}

function candHtml(c, id) {
  return `
    <li class="cand">
      <button type="button" class="cand-head" aria-expanded="false" aria-controls="${id}">
        <span class="cand-name">${esc(c.name)}</span>
        ${c.fromStay ? `<span class="cand-dist">${esc(c.fromStay)}</span>` : ''}
        <span class="chev" aria-hidden="true"></span>
      </button>
      <div class="cand-body" id="${id}" hidden>
        ${descHtml(c)}
        ${infoHtml(c)}
      </div>
    </li>`;
}

// 후보 구간. icon(food/cafe/shop/sight)을 정하면 원 안에 그 아이콘과 이름이 보이고, 후보가 0곳이어도 구간이 생긴다.
function gapHtml(list, gi, icon) {
  const id = `gap-${gi}`;
  const mark = ICONS[icon] && THEN_LABELS[icon]
    ? `<span class="gap-icon">${ICONS[icon]}</span>`
    : '<span class="gap-plus" aria-hidden="true">+</span>';
  const name = THEN_LABELS[icon] ?? '이 사이 후보';
  const count = list.length ? ` <b>${list.length}</b>곳` : ' <span class="gap-none">· 아직 없음</span>';
  const body = list.length
    ? `<ul class="gap-box cands${list.length >= SCROLL_FROM ? ' gap-scroll' : ''}">
            ${list.map((c, ci) => candHtml(c, `${id}-${ci}`)).join('')}
          </ul>`
    : '<p class="gap-box gap-empty">아직 후보가 없습니다</p>';
  return `
    <li class="gap" data-fold>
      <button type="button" class="gap-toggle" data-fold-toggle aria-expanded="false" aria-controls="${id}">
        ${mark}
        <span>${name}${count}</span>
        <span class="chev" aria-hidden="true"></span>
      </button>
      <div class="gap-panel fold-panel" id="${id}">
        <div class="gap-clip">
          ${body}
        </div>
      </div>
    </li>`;
}

export function routeHtml(stops) {
  if (!stops.length) return '<p class="route-empty">아직 일정이 없습니다</p>';
  const parts = [];
  stops.forEach((s, i) => {
    parts.push(stopHtml(s, i));
    if (s.move?.steps?.length) parts.push(moveHtml(s.move, i));
    const then = Array.isArray(s.then) ? s.then : [];
    if (then.length || THEN_LABELS[s.thenIcon]) parts.push(gapHtml(then, i, s.thenIcon));
  });
  return `<ol class="route">${parts.join('')}</ol>`;
}
