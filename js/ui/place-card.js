import { esc, html, stayLabel } from './dom.js';
import { openSheet, closeSheet } from './sheet.js';
import { KIND_LABELS, NEW_YEAR_LABELS, directionsUrl } from '../places.js';

// 장소 카드. onEdit(place), onDelete(place)
export function openPlaceCard(place, { days, onEdit, onDelete }) {
  const day = days.find((d) => d.id === place.dayId);
  const stayDays = place.kind === 'stay'
    ? (place.stayDayIds?.length ? place.stayDayIds.map((id) => days.find((d) => d.id === id)?.label).filter(Boolean).join(', ') : '전 일정')
    : '';
  const meta = [
    KIND_LABELS[place.kind],
    day?.label,
    place.kind === 'plan' && place.order ? `${place.order}번째` : '',
    place.time,
    place.stayMinutes ? `${stayLabel(place.stayMinutes)} 머무름` : '',
    stayDays ? `숙박 ${stayDays}` : '',
  ].filter(Boolean);

  const rows = [
    ['분류', place.category],
    ['영업시간', place.hours],
    ['연말연시', NEW_YEAR_LABELS[place.newYearOpen]],
    ['메모', place.memo],
  ].filter(([, v]) => v);

  const el = html`
    <div class="card">
      <p class="card-meta">${meta.map(esc).join(' · ')}</p>
      ${rows.length ? `<dl class="card-rows">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      <div class="card-actions">
        <a class="btn btn-primary" href="${esc(directionsUrl(place))}" target="_blank" rel="noopener">구글맵 길찾기</a>
        <button type="button" class="btn" data-act="edit">수정</button>
        <button type="button" class="btn btn-danger-text" data-act="delete">삭제</button>
      </div>
      <div class="card-confirm" hidden>
        <p>‘${esc(place.name)}’을(를) 삭제할까요?</p>
        <div class="card-actions">
          <button type="button" class="btn" data-act="cancel">취소</button>
          <button type="button" class="btn btn-danger" data-act="confirm">삭제</button>
        </div>
      </div>
    </div>`;

  const confirmBox = el.querySelector('.card-confirm');
  el.querySelector('[data-act="edit"]').addEventListener('click', () => onEdit(place));
  el.querySelector('[data-act="delete"]').addEventListener('click', () => { confirmBox.hidden = false; });
  el.querySelector('[data-act="cancel"]').addEventListener('click', () => { confirmBox.hidden = true; });
  el.querySelector('[data-act="confirm"]').addEventListener('click', () => { onDelete(place); closeSheet(); });

  openSheet(el, { title: place.name });
}
