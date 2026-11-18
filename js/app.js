import { createStore } from './store.js';
import { resolveTab } from './router.js';
import * as homeTab from './tabs/home.js';
import * as mapTab from './tabs/map.js';
import * as checklistTab from './tabs/checklist.js';
import * as transitTab from './tabs/transit.js';
import * as expenseTab from './tabs/expense.js';

const MODULES = { home: homeTab, map: mapTab, checklist: checklistTab, transit: transitTab, expense: expenseTab };

const BANNER_TEXT = {
  'storage-unavailable': '이 기기에 저장되지 않습니다. 백업을 자주 해주세요.',
  'save-failed': '저장에 실패했습니다. 백업을 자주 해주세요.',
  'corrupt-data': '저장된 데이터를 읽지 못해 새로 시작했습니다. 이전 데이터는 따로 보관되어 있습니다.',
  'corrupt-unsaved': '저장된 데이터를 읽지 못했습니다. 기존 데이터를 지키기 위해 지금은 저장하지 않습니다.',
  'newer-version': '더 새 버전에서 저장된 데이터입니다. 앱을 완전히 닫았다가 다시 열어주세요. 그 전까지는 저장하지 않습니다.',
};

function getStorage() {
  try {
    const s = window.localStorage;
    s.getItem('__probe__');
    return s;
  } catch {
    return null;
  }
}

const store = createStore(getStorage());
const view = document.getElementById('view');
const banner = document.getElementById('banner');
const buttons = [...document.querySelectorAll('#tabbar button[data-tab]')];

function showBanner() {
  const text = store.lastError && BANNER_TEXT[store.lastError];
  banner.hidden = !text;
  if (text) banner.textContent = text;
}

let current = null;

function render(tab) {
  if (current && current !== tab) MODULES[current].unmount?.();
  current = tab;
  for (const b of buttons) {
    if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
  view.replaceChildren();
  view.scrollTop = 0;
  MODULES[tab].mount(view, store);
  showBanner();
}

for (const b of buttons) {
  b.addEventListener('click', () => {
    const tab = resolveTab(b.dataset.tab);
    store.update((d) => { d.ui.tab = tab; });
    render(tab);
  });
}

// 앱은 항상 홈에서 시작한다
render('home');

navigator.storage?.persist?.().catch(() => {});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
