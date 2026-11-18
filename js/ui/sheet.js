// 화면 아래에서 올라오는 시트. 한 번에 하나만 열리고, 내용은 바꿔 끼울 수 있다.
// 폰의 뒤로가기 버튼으로도 닫힌다(history 사용).

let current = null; // { root, body, onClose }

function teardown() {
  if (!current) return;
  const { root, onClose } = current;
  current = null;
  root.classList.remove('sheet-open');
  setTimeout(() => root.remove(), 250);
  onClose?.();
}

window.addEventListener('popstate', () => { if (current) teardown(); });

export function openSheet(content, { title = '', onClose } = {}) {
  if (!current) {
    const root = document.createElement('div');
    root.className = 'sheet-root';
    root.innerHTML = `
      <div class="sheet-backdrop"></div>
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-handle" aria-hidden="true"></div>
        <div class="sheet-head"><h2 class="sheet-title"></h2>
          <button type="button" class="sheet-close" aria-label="닫기">닫기</button></div>
        <div class="sheet-body"></div>
      </div>`;
    document.body.append(root);
    root.querySelector('.sheet-backdrop').addEventListener('click', closeSheet);
    root.querySelector('.sheet-close').addEventListener('click', closeSheet);
    current = { root, body: root.querySelector('.sheet-body') };
    history.pushState({ sheet: true }, '');
    requestAnimationFrame(() => root.classList.add('sheet-open'));
  }
  else current.onClose?.(); // 내용을 바꿔 끼우면 이전 내용의 정리 작업 실행
  current.onClose = onClose;
  current.root.querySelector('.sheet-title').textContent = title;
  current.body.replaceChildren(content);
  current.body.scrollTop = 0;
}

export function closeSheet() {
  if (!current) return;
  if (history.state?.sheet) history.back(); // popstate에서 닫힘
  else teardown();
}

export function isSheetOpen() {
  return !!current;
}
