import { SCHEDULE } from '../schedule.js';
import { esc } from '../ui/dom.js';

function itemHtml(it) {
  return `
    <li class="sch-item">
      <span class="sch-time">${esc(it.time ?? '')}</span>
      <div class="sch-text">
        <strong>${esc(it.title)}</strong>
        ${it.memo ? `<p>${esc(it.memo)}</p>` : ''}
      </div>
    </li>`;
}

export function mount(el) {
  const days = SCHEDULE.map((d, i) => `
    <section class="sch-day">
      <h2><span class="sch-num">${i + 1}일차</span> ${esc(d.label)}</h2>
      ${d.items.length
        ? `<ol class="sch-list">${d.items.map(itemHtml).join('')}</ol>`
        : '<p class="placeholder">아직 일정이 없습니다</p>'}
    </section>`).join('');

  el.innerHTML = `
    <section class="page schedule">
      <h1>일정</h1>
      ${days}
    </section>`;
}
