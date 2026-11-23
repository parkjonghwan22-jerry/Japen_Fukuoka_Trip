// 일차 상세 화면: 누른 일차 카드가 위로 올라가 제목이 되고, 그 아래에 노선 본문이 펼쳐진다.
// 안드로이드 뒤로가기로 닫을 수 있도록 열 때 history 기록을 하나 남긴다.
import { esc } from './dom.js';
import { routeHtml } from './route.js';

const NAME = 'day-head';
let current = null; // { root, card }

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 화면 전환 효과(View Transitions). 지원하지 않으면 바로 바꾼다.
function transition(update) {
  if (!document.startViewTransition || reduceMotion()) {
    update();
    return Promise.resolve();
  }
  return document.startViewTransition(update).finished.catch(() => {});
}

function build(day, index, stayName) {
  const root = document.createElement('div');
  root.className = 'dv';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', `${index + 1}일차 일정`);
  root.innerHTML = `
    <header class="dv-head">
      <button type="button" class="dv-back" aria-label="일차 목록으로">
        <span class="chev chev-left" aria-hidden="true"></span>
      </button>
      <div class="dv-titles">
        <p class="dv-kicker">${index + 1}일차 · ${esc(day.label)}</p>
        <h2 class="dv-title">${esc(day.title || '일정')}</h2>
        ${stayName ? `<p class="dv-stay">숙소 · ${esc(stayName)}</p>` : ''}
      </div>
    </header>
    <div class="dv-body">${routeHtml(day.stops ?? [])}</div>`;
  return root;
}

// 펼치고 접는 곳: 이동 구간, 후보 구간, 세부 정보가 있는 일정 카드 (한 번에 하나만 열린다)
function setupGaps(root) {
  const body = root.querySelector('.dv-body');
  const folds = [...root.querySelectorAll('[data-fold]')];
  const toggleOf = (f) => f.querySelector('[data-fold-toggle]');

  const setOpen = (f, open) => {
    f.classList.toggle('open', open);
    toggleOf(f).setAttribute('aria-expanded', String(open));
  };

  for (const f of folds) {
    toggleOf(f).addEventListener('click', () => {
      const open = !f.classList.contains('open');
      for (const g of folds) if (g !== f) setOpen(g, false);
      setOpen(f, open);
      if (open) {
        // 펼쳐지는 애니메이션이 끝난 뒤 화면 안에 들어오게
        setTimeout(() => f.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' }), 320);
      }
    });

    // 따로 스크롤되는 영역: 끝에 닿기 전까지 아래쪽을 흐리게 해서 "더 있다"를 보여준다
    const list = f.querySelector('.gap-scroll');
    if (list) {
      const mark = () => list.classList.toggle('at-end', list.scrollTop + list.clientHeight >= list.scrollHeight - 4);
      list.addEventListener('scroll', mark, { passive: true });
      toggleOf(f).addEventListener('click', () => requestAnimationFrame(mark));
    }
  }

  // 후보 하나 누르면 설명이 펼쳐진다
  body.addEventListener('click', (e) => {
    const head = e.target.closest('.cand-head');
    if (!head) return;
    const open = head.getAttribute('aria-expanded') !== 'true';
    head.setAttribute('aria-expanded', String(open));
    head.nextElementSibling.hidden = !open;
  });
}

function onPop() {
  if (current) close({ fromHistory: true });
}

export function openDay(day, index, card, stayName) {
  if (current) return;
  const root = build(day, index, stayName);
  setupGaps(root);
  root.querySelector('.dv-back').addEventListener('click', () => history.back());

  card.style.viewTransitionName = NAME;
  current = { root, card };
  transition(() => {
    card.style.viewTransitionName = '';
    root.querySelector('.dv-head').style.viewTransitionName = NAME;
    document.body.append(root);
    if (!document.startViewTransition || reduceMotion()) root.classList.add('dv-enter');
  }).then(() => {
    root.querySelector('.dv-head').style.viewTransitionName = '';
    root.querySelector('.dv-back').focus({ preventScroll: true });
  });

  history.pushState({ dayView: index }, '');
  window.addEventListener('popstate', onPop);
}

// fromHistory: 뒤로가기로 닫힘 / 아니면(탭 이동 등) 남긴 기록을 따로 정리하지 않는다
export function close({ fromHistory = false, animate = true } = {}) {
  if (!current) return;
  const { root, card } = current;
  current = null;
  window.removeEventListener('popstate', onPop);
  const head = root.querySelector('.dv-head');

  if (!animate || !card.isConnected) {
    root.remove();
    return;
  }
  head.style.viewTransitionName = NAME;
  transition(() => {
    root.remove();
    card.style.viewTransitionName = NAME;
  }).then(() => {
    card.style.viewTransitionName = '';
    if (fromHistory) card.focus({ preventScroll: true });
  });
}
