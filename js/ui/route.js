// 일차 상세의 노선(핵심 일정 점 + 점 사이 후보 목록)을 HTML 문자열로 만든다. DOM 없이 테스트할 수 있다.
import { esc } from './dom.js';
import { RESERVATION } from '../schedule/index.js';

// 후보가 이 개수 이상이면 후보 목록에 따로 스크롤을 준다
export const SCROLL_FROM = 5;

const resvKey = (p) => (RESERVATION[p.reservation] ? p.reservation : 'none');

function infoHtml(p) {
  const rows = [];
  if (p.area) rows.push(['위치', esc(p.area)]);
  if (p.fromStay) rows.push(['숙소에서', esc(p.fromStay)]);
  const key = resvKey(p);
  rows.push(['예약', `<span class="badge badge-${key}">${RESERVATION[key]}</span>`
    + (p.reservationNote ? ` <span class="resv-note">${esc(p.reservationNote)}</span>` : '')]);
  return `<dl class="info">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}

const descHtml = (p) => (p.desc ? `<p class="desc">${esc(p.desc)}</p>` : '');

function stopHtml(s) {
  return `
    <li class="stop">
      <span class="stop-dot" aria-hidden="true"></span>
      <article class="stop-card">
        ${s.time ? `<p class="stop-time">${esc(s.time)}</p>` : ''}
        <h3 class="stop-name">${esc(s.name)}</h3>
        ${descHtml(s)}
        ${infoHtml(s)}
      </article>
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

function gapHtml(list, gi) {
  const id = `gap-${gi}`;
  return `
    <li class="gap">
      <button type="button" class="gap-toggle" aria-expanded="false" aria-controls="${id}">
        <span class="gap-plus" aria-hidden="true">+</span>
        <span>이 사이 후보 <b>${list.length}</b>곳</span>
        <span class="chev" aria-hidden="true"></span>
      </button>
      <div class="gap-panel" id="${id}">
        <div class="gap-clip">
          <ul class="cands${list.length >= SCROLL_FROM ? ' scroll' : ''}">
            ${list.map((c, ci) => candHtml(c, `${id}-${ci}`)).join('')}
          </ul>
        </div>
      </div>
    </li>`;
}

export function routeHtml(stops) {
  if (!stops.length) return '<p class="route-empty">아직 일정이 없습니다</p>';
  const parts = [];
  stops.forEach((s, i) => {
    parts.push(stopHtml(s));
    if (Array.isArray(s.then) && s.then.length) parts.push(gapHtml(s.then, i));
  });
  return `<ol class="route">${parts.join('')}</ol>`;
}
