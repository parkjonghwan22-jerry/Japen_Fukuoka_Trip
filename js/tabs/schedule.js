import { DAYS, STAYS } from '../schedule/index.js';
import { DEMO_DAYS, DEMO_STAYS } from '../schedule/demo.js';
import { esc } from '../ui/dom.js';
import { openDay, close } from '../ui/day-view.js';

const isDemo = () => new URLSearchParams(location.search).has('demo');

function cardHtml(day, i, stayName) {
  const n = day.stops?.length ?? 0;
  const sub = [n ? `핵심 일정 ${n}곳` : '일정 없음', stayName].filter(Boolean).join(' · ');
  return `
    <li>
      <button type="button" class="day-card" data-i="${i}">
        <span class="day-kicker">${i + 1}일차 · ${esc(day.label)}</span>
        <span class="day-title${day.title ? '' : ' empty'}">${esc(day.title || '아직 정하지 않음')}</span>
        <span class="day-sub">${esc(sub)}</span>
        <span class="chev" aria-hidden="true"></span>
      </button>
    </li>`;
}

export function mount(el) {
  const demo = isDemo();
  const days = demo ? DEMO_DAYS : DAYS;
  const stays = demo ? DEMO_STAYS : STAYS;
  const stayName = (d) => (d.stay && stays[d.stay]?.name) || '';

  el.innerHTML = `
    <section class="page schedule">
      <h1>일정</h1>
      <p class="sch-sub">2026.12.31(목) – 2027.1.4(월) · 4박 5일</p>
      ${demo ? '<p class="demo-note">예시 데이터로 보는 중입니다 (주소의 ?demo)</p>' : ''}
      <ol class="day-list">${days.map((d, i) => cardHtml(d, i, stayName(d))).join('')}</ol>
    </section>`;

  el.querySelector('.day-list').addEventListener('click', (e) => {
    const card = e.target.closest('.day-card');
    if (!card) return;
    const i = Number(card.dataset.i);
    openDay(days[i], i, card, stayName(days[i]));
  });
}

export function unmount() {
  close({ animate: false });
}
