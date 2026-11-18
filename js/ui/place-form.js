import { esc, html, stayLabel } from './dom.js';
import { openSheet, closeSheet } from './sheet.js';
import { KINDS, KIND_LABELS, CATEGORIES, NEW_YEAR, NEW_YEAR_LABELS, STAY_OPTIONS, validatePlace } from '../places.js';

const segment = (name, options, value) => `
  <div class="seg" role="radiogroup">
    ${options.map(([v, label]) => `
      <label class="seg-item"><input type="radio" name="${name}" value="${esc(v)}" ${v === value ? 'checked' : ''}><span>${esc(label)}</span></label>`).join('')}
  </div>`;

// 새 장소 또는 수정. initial: 부분 Place(lat,lng,name 등). onSave(place)
export function openPlaceForm(initial, { days, onSave }) {
  const p = {
    kind: 'plan', dayId: null, category: '기타', newYearOpen: 'unknown', stayDayIds: [], ...initial,
  };
  const editing = !!p.id;
  const dayOptions = days.map((d) => [d.id, d.label]);
  const locText = p.address
    ? p.address
    : `지도에서 고른 위치 (${Number(p.lat).toFixed(4)}, ${Number(p.lng).toFixed(4)})`;

  const el = html`
    <form class="form" novalidate>
      <label class="field">
        <span class="field-label">이름</span>
        <input name="name" type="text" value="${esc(p.name ?? '')}" placeholder="예: 이치란 본점" autocomplete="off">
        <span class="field-error" data-err="name"></span>
      </label>

      <div class="field">
        <span class="field-label">위치</span>
        <p class="field-static">${esc(locText)}</p>
        <span class="field-error" data-err="location"></span>
      </div>

      <div class="field">
        <span class="field-label">종류</span>
        ${segment('kind', KINDS.map((k) => [k, KIND_LABELS[k]]), p.kind)}
      </div>

      <div class="field" data-show="plan">
        <span class="field-label">일차</span>
        ${segment('dayId', dayOptions, p.dayId)}
        <span class="field-error" data-err="dayId"></span>
      </div>

      <div class="field-row" data-show="plan">
        <label class="field">
          <span class="field-label">시간</span>
          <input name="time" type="time" value="${esc(p.time ?? '')}">
        </label>
        <label class="field">
          <span class="field-label">머무는 시간</span>
          <select name="stayMinutes">
            ${STAY_OPTIONS.map((m) => `<option value="${m ?? ''}" ${m === (p.stayMinutes ?? null) ? 'selected' : ''}>${m == null ? '없음' : stayLabel(m)}</option>`).join('')}
          </select>
        </label>
      </div>

      <div class="field" data-show="stay">
        <span class="field-label">묵는 날 <small>(안 고르면 전 일정)</small></span>
        <div class="seg seg-multi">
          ${dayOptions.map(([v, label]) => `
            <label class="seg-item"><input type="checkbox" name="stayDayIds" value="${v}" ${p.stayDayIds?.includes(v) ? 'checked' : ''}><span>${esc(label)}</span></label>`).join('')}
        </div>
      </div>

      <div class="field">
        <span class="field-label">분류</span>
        ${segment('category', CATEGORIES.map((c) => [c, c]), p.category)}
      </div>

      <label class="field">
        <span class="field-label">영업시간</span>
        <input name="hours" type="text" value="${esc(p.hours ?? '')}" placeholder="예: 10:00–22:00, 화요일 휴무">
      </label>

      <div class="field">
        <span class="field-label">연말연시 영업</span>
        ${segment('newYearOpen', NEW_YEAR.map((v) => [v, NEW_YEAR_LABELS[v]]), p.newYearOpen)}
      </div>

      <label class="field">
        <span class="field-label">메모</span>
        <textarea name="memo" rows="3" placeholder="예약번호, 추천 메뉴 등">${esc(p.memo ?? '')}</textarea>
      </label>

      <div class="form-actions">
        <button type="button" class="btn" data-act="cancel">취소</button>
        <button type="submit" class="btn btn-primary">${editing ? '저장' : '추가'}</button>
      </div>
    </form>`;

  const form = el;
  function syncKind() {
    const kind = form.elements.kind.value;
    form.querySelectorAll('[data-show]').forEach((s) => { s.hidden = s.dataset.show !== kind; });
  }
  form.addEventListener('change', (e) => { if (e.target.name === 'kind') syncKind(); });
  syncKind();

  form.querySelector('[data-act="cancel"]').addEventListener('click', closeSheet);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = form.elements;
    const input = {
      ...p,
      name: f.name.value,
      kind: f.kind.value,
      dayId: f.dayId.value || null,
      time: f.time.value,
      stayMinutes: f.stayMinutes.value,
      stayDayIds: [...form.querySelectorAll('input[name="stayDayIds"]:checked')].map((i) => i.value),
      category: f.category.value,
      hours: f.hours.value,
      newYearOpen: f.newYearOpen.value,
      memo: f.memo.value,
    };
    const r = validatePlace(input);
    form.querySelectorAll('[data-err]').forEach((s) => { s.textContent = r.ok ? '' : (r.errors[s.dataset.err] ?? ''); });
    if (!r.ok) {
      form.querySelector('.field-error:not(:empty)')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    onSave(r.place);
    closeSheet();
  });

  openSheet(form, { title: editing ? '장소 수정' : '장소 추가' });
  if (!editing && !p.name) setTimeout(() => form.elements.name.focus(), 300);
}
