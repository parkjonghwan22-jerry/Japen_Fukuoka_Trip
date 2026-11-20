import { BUNDLED_PHOTOS } from '../photos.js';
import { toast } from '../ui/dom.js';

let selected = 0; // 앱이 켜져 있는 동안 마지막으로 고른 사진을 기억

export function mount(el) {
  const photos = BUNDLED_PHOTOS;
  if (selected >= photos.length) selected = 0;

  el.innerHTML = `
    <section class="page home">
      <header class="home-head">
        <h1>후쿠오카</h1>
        <p class="home-dates">2026.12.31(목) – 2027.1.4(월)</p>
      </header>
      <figure class="photo-card">
        <img class="photo-main" alt="">
      </figure>
      <div class="thumbs" role="list" aria-label="사진 목록"></div>
    </section>`;

  const main = el.querySelector('.photo-main');
  const strip = el.querySelector('.thumbs');

  function show(i) {
    selected = i;
    main.src = photos[i].src;
    main.alt = photos[i].alt;
    strip.querySelectorAll('.thumb').forEach((b, j) => {
      b.setAttribute('aria-current', j === i ? 'true' : 'false');
    });
  }

  photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.setAttribute('role', 'listitem');
    b.setAttribute('aria-label', `${i + 1}번째 사진 보기`);
    b.innerHTML = `<img src="${p.thumb}" alt="" loading="lazy">`;
    b.addEventListener('click', () => show(i));
    strip.append(b);
  });

  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'thumb thumb-add';
  add.setAttribute('aria-label', '사진 추가');
  add.textContent = '+';
  add.addEventListener('click', () => toast('사진 추가 기능은 곧 추가됩니다'));
  strip.append(add);

  show(selected);
}
