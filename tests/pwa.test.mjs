import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('manifest는 하위 경로 배포용 상대경로와 아이콘 3종을 가진다', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  assert.equal(m.start_url, './');
  assert.equal(m.scope, './');
  assert.equal(m.display, 'standalone');
  assert.equal(m.icons.length, 3);
  assert.ok(m.icons.some((i) => i.purpose === 'maskable'));
  for (const i of m.icons) assert.ok(existsSync(new URL(i.src, root)), i.src);
});

test('서비스 워커가 미리 캐시하는 파일이 모두 존재하고 절대경로가 없다', () => {
  const sw = read('sw.js');
  const list = JSON.parse(sw.match(/const APP_FILES = (\[[\s\S]*?\]);/)[1]);
  for (const f of list) {
    assert.ok(f.startsWith('./'), f);
    if (f !== './') assert.ok(existsSync(new URL(f, root)), f);
  }
  for (const f of ['./index.html', './js/app.js', './js/store.js', './js/router.js', './css/app.css']) {
    assert.ok(list.includes(f), `${f} 누락`);
  }
});

test('index.html은 루트 절대경로를 쓰지 않는다', () => {
  assert.doesNotMatch(read('index.html'), /(href|src)="\//);
});

test('js 폴더의 모든 파일이 미리 캐시 목록에 있다', async () => {
  const { readdirSync } = await import('node:fs');
  const sw = read('sw.js');
  const list = JSON.parse(sw.match(/const APP_FILES = (\[[\s\S]*?\]);/)[1]);
  const files = readdirSync(new URL('js/', root), { recursive: true })
    .filter((f) => f.endsWith('.js'))
    .map((f) => './js/' + f.split('\\').join('/'));
  for (const f of files) assert.ok(list.includes(f), `${f}가 sw.js APP_FILES에 없음`);
});
