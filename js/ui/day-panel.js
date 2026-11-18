import { esc, stayLabel } from './dom.js';
import { daySections, candidateItems, timeWarnings } from '../itinerary.js';
import { CANDIDATE_COLOR, STAY_COLOR } from '../map/model.js';

const SWIPE_PX = 30;

// 지도 아래 일정 패널. callbacks: onSelect(place), onMove(id, dir), onAddToDay(id, dayId)
export function createDayPanel(container, { onSelect, onMove, onAddToDay }) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.dataset.state = 'collapsed';
  el.innerHTML = `
    <div class="panel-head" role="button" tabindex="0" aria-expanded="false">
      <span class="panel-handle" aria-hidden="true"></span>
      <div class="panel-title-row">
        <strong class="panel-title"></strong>
        <span class="panel-hint"></span>
      </div>
    </div>
    <div class="panel-tools" hidden>
      <button type="button" class="panel-edit">순서 바꾸기</button>
    </div>
    <div class="panel-body"></div>`;
  container.append(el);

  const head = el.querySelector('.panel-head');
  const title = el.querySelector('.panel-title');
  const hint = el.querySelector('.panel-hint');
  const tools = el.querySelector('.panel-tools');
  const editBtn = el.querySelector('.panel-edit');
  const body = el.querySelector('.panel-body');

  let editing = false;
  let openPicker = null; // 일정에 넣기 일차 선택이 열린 후보 id
  let last = null; // 마지막 update 인자

  function setState(s) {
    el.dataset.state = s;
    head.setAttribute('aria-expanded', String(s === 'expanded'));
    hint.textContent = s === 'expanded' ? '접기' : '목록 보기';
  }
  const expand = () => setState('expanded');
  const collapse = () => setState('collapsed');
  const toggle = () => setState(el.dataset.state === 'expanded' ? 'collapsed' : 'expanded');

  // 제목 줄: 누르면 전환, 위로 쓸면 펼침, 아래로 쓸면 접힘
  let startY = null;
  let moved = false;
  head.addEventListener('pointerdown', (e) => { startY = e.clientY; moved = false; });
  head.addEventListener('pointermove', (e) => {
    if (startY == null) return;
    const dy = e.clientY - startY;
    if (dy < -SWIPE_PX) { expand(); moved = true; startY = null; }
    else if (dy > SWIPE_PX) { collapse(); moved = true; startY = null; }
  });
  head.addEventListener('pointerup', () => { startY = null; });
  head.addEventListener('click', () => { if (!moved) toggle(); moved = false; });
  head.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });

  editBtn.addEventListener('click', () => {
    editing = !editing;
    render();
  });

  body.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t || !last) return;
    const id = t.dataset.id;
    const place = last.places.find((p) => p.id === id);
    switch (t.dataset.act) {
      case 'select': if (place) onSelect(place); break;
      case 'up': onMove(id, -1); break;
      case 'down': onMove(id, 1); break;
      case 'pick': openPicker = openPicker === id ? null : id; render(); break;
      case 'add-day': openPicker = null; onAddToDay(id, t.dataset.day); break;
      default:
    }
  });

  function sub(p, warn) {
    const parts = [
      p.time,
      p.stayMinutes ? stayLabel(p.stayMinutes) : '',
      p.category && p.category !== '기타' ? p.category : '',
    ].filter(Boolean).map(esc);
    if (warn) parts.push('<em class="row-warn">시간 확인</em>');
    return parts.join(' · ');
  }

  function row(p, badge, color, { warn = false, canMove = false, first = false, lastItem = false } = {}) {
    return `
      <li class="row">
        <button type="button" class="row-main" data-act="select" data-id="${esc(p.id)}">
          <span class="row-badge" style="background:${color}">${esc(badge)}</span>
          <span class="row-text"><strong>${esc(p.name)}</strong>${sub(p, warn) ? `<span class="row-sub">${sub(p, warn)}</span>` : ''}</span>
        </button>
        ${canMove ? `
          <span class="row-move">
            <button type="button" data-act="up" data-id="${esc(p.id)}" aria-label="위로" ${first ? 'disabled' : ''}>↑</button>
            <button type="button" data-act="down" data-id="${esc(p.id)}" aria-label="아래로" ${lastItem ? 'disabled' : ''}>↓</button>
          </span>` : ''}
      </li>`;
  }

  function render() {
    if (!last) return;
    const { places, days, filter, isSample } = last;
    const isDay = filter.startsWith('d');
    if (!isDay) editing = false;
    tools.hidden = !isDay || isSample;
    editBtn.textContent = editing ? '완료' : '순서 바꾸기';
    editBtn.classList.toggle('on', editing);

    if (filter === 'candidates') {
      const items = candidateItems(places);
      title.textContent = `후보 · ${items.length}곳`;
      body.innerHTML = items.length
        ? `<ul class="rows">${items.map((p) => `
            ${row(p, '', CANDIDATE_COLOR)}
            ${isSample ? '' : `
              <li class="row-extra">
                <button type="button" class="link-btn" data-act="pick" data-id="${esc(p.id)}">일정에 넣기</button>
                ${openPicker === p.id ? `<span class="day-pick">${days.map((d) => `
                  <button type="button" class="chip-sm" data-act="add-day" data-id="${esc(p.id)}" data-day="${esc(d.id)}">${esc(d.label)}</button>`).join('')}</span>` : ''}
              </li>`}`).join('')}</ul>`
        : '<p class="panel-empty">후보가 없어요. 지도를 길게 눌러 후보로 추가해보세요.</p>';
      return;
    }

    const sections = daySections(places, days, filter);
    const total = sections.reduce((n, s) => n + s.items.length, 0);
    title.textContent = filter === 'all' ? `전체 일정 · ${total}곳` : `${sections[0].label} · ${total}곳`;

    const tip = filter === 'all' && !isSample && total > 1
      ? '<p class="panel-tip">순서를 바꾸려면 위에서 날짜(예: 12/31)를 먼저 고른 뒤 <b>순서 바꾸기</b>를 누르세요.</p>' : '';
    body.innerHTML = tip + sections.map((s) => {
      const warn = timeWarnings(s.items);
      const list = s.items.map((p, i) => row(p, String(i + 1), s.color, {
        warn: warn.has(p.id),
        canMove: editing && !isSample,
        first: i === 0,
        lastItem: i === s.items.length - 1,
      })).join('');
      const stays = s.stays.map((p) => row(p, '숙', STAY_COLOR)).join('');
      const empty = filter !== 'all' && !s.items.length && !s.stays.length
        ? '<p class="panel-empty">아직 일정이 없어요. 지도를 길게 눌러 추가해보세요.</p>' : '';
      const header = filter === 'all'
        ? `<h3 class="sec-title"><span class="sec-dot" style="background:${s.color}"></span>${esc(s.label)} · ${s.items.length}곳</h3>` : '';
      return `<section class="sec">${header}${list || stays ? `<ul class="rows">${list}${stays}</ul>` : ''}${empty}</section>`;
    }).join('') + (filter === 'all' && total === 0 ? '<p class="panel-empty">아직 일정이 없어요. 지도를 길게 눌러 추가해보세요.</p>' : '');
  }

  setState('collapsed');
  return {
    update(state) { last = state; render(); },
    expand,
    collapse,
    element: el,
  };
}
