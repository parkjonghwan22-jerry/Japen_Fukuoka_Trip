// 작은 DOM 도우미

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

export function html(strings, ...values) {
  const tpl = document.createElement('template');
  tpl.innerHTML = strings.reduce((out, s, i) => out + s + (i < values.length ? values[i] : ''), '').trim();
  return tpl.content.firstElementChild;
}

export function toast(text) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = text;
  document.body.append(el);
  setTimeout(() => el.remove(), 2400);
}

export const stayLabel = (m) => (m == null ? '' : m < 60 ? `${m}분` : m % 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m / 60}시간`);
