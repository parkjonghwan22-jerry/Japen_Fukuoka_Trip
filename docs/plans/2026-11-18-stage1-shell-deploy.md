# 1단계: 뼈대 + 배포 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 하단 메뉴 4개(빈 화면)를 가진 PWA를 GitHub Pages에 올려, 안드로이드 크롬에서 홈 화면 앱으로 설치되는 상태를 만든다.

**Architecture:** 빌드 단계 없는 정적 파일(바닐라 JS ES 모듈). 상태는 `store.js` 하나가 소유하고 localStorage에 JSON으로 저장한다. 서비스 워커가 앱 파일을 캐시해 오프라인에서도 열린다. 이후 단계는 각 탭 모듈을 채우는 방식으로 붙는다.

**Tech Stack:** HTML/CSS/JS(ES2020 모듈), Node 22 `node:test`(저장소 단위 테스트), Python Pillow(아이콘 생성, 1회), Chrome DevTools(모바일 화면 확인), GitHub Pages.

**Spec:** `/Users/bagjonghwan/Desktop/jonghwan/fukuoka-trip/docs/design.md`

## Global Constraints
- 비용 0원, API 키 없음.
- UI 언어 한국어. 본문 글자 16px 이상, 한 손 조작(하단 메뉴 터치 영역 높이 56px 이상).
- 기준 화면: 안드로이드 폰 세로(검증 뷰포트 390×844).
- 여행 일차: `2026-12-31(목)`, `2027-01-01(금)`, `2027-01-02(토)`, `2027-01-03(일)`.
- 하단 메뉴 순서·라벨: `🗺 지도` / `✅ 준비물` / `🚇 교통` / `💴 지출`.
- GitHub Pages는 `https://<계정>.github.io/<저장소>/` 하위 경로로 서비스됨 → **모든 경로는 상대경로**(`./`), 루트 절대경로(`/...`) 금지.
- 실제 장소 목록은 저장소 파일에 넣지 않는다(설계 5.4).
- 프로젝트 루트: `/Users/bagjonghwan/Desktop/jonghwan/fukuoka-trip/`

## Review Focus
1. **저장된 JSON이 깨졌을 때** → 기본값으로 덮어쓰지 않고 원본 문자열을 `fukuoka-trip:corrupt:<타임스탬프>` 키에 보존한 뒤 기본 상태로 시작한다. (Task 1 테스트)
2. **localStorage 사용 불가/용량 초과** → 앱은 메모리 상태로 계속 동작하고, `store.lastError`로 알 수 있으며 화면 상단에 경고 배너를 띄운다. (Task 1 테스트, Task 2 확인)
3. **새 버전을 배포했는데 폰에 옛 화면이 남음** → HTML 요청은 네트워크 우선·실패 시 캐시, 캐시 이름에 버전 포함, 새 서비스 워커는 즉시 활성화. (Task 3 확인)
4. **하위 경로 배포에서 아이콘/스크립트 404** → manifest `start_url`·`scope`는 `./`, 모든 참조는 상대경로. (Task 3·4 확인)
5. **브라우저가 저장 데이터를 정리함** → 시작 시 `navigator.storage.persist()` 요청. (Task 2)

---

### Task 1: 상태 저장소 `store.js`

**Files:**
- Create: `js/store.js`
- Test: `tests/store.test.mjs`
- Create: `package.json` (`{"type":"module","scripts":{"test":"node --test tests/"}}`, 의존성 없음)

**Interfaces:**
- Produces:
  - `STORAGE_KEY = 'fukuoka-trip:v1'`
  - `SCHEMA_VERSION = 1`
  - `defaultState(): State` —
    `{ version: 1, trip: { title: '후쿠오카 여행', days: [{id:'d1',date:'2026-12-31',label:'12/31(목)'},{id:'d2',date:'2027-01-01',label:'1/1(금)'},{id:'d3',date:'2027-01-02',label:'1/2(토)'},{id:'d4',date:'2027-01-03',label:'1/3(일)'}], fxRate: null }, people: [], places: [], checklist: [], transit: [], expenses: [], ui: { tab: 'map' } }`
  - `createStore(storage: Storage | null): { get(): State, update(fn: (draft: State) => void): void, subscribe(fn: (s: State) => void): () => void, lastError: string | null }`
    - `update`는 깊은 복사본을 `fn`에 넘기고, 결과를 저장한 뒤 구독자에게 알린다.
  - `newId(prefix: string): string` — `prefix + '_' + 시간36진수 + 랜덤4자`, 이후 단계의 장소·지출 ID에 사용.

- [ ] **Step 1: 실패하는 테스트 작성** (`tests/store.test.mjs`, 메모리 `Storage` 대역 사용)
  - `test('저장된 값이 없으면 기본 상태')` → `get()`이 `defaultState()`와 deepEqual, `trip.days.length === 4`, `days[0].date === '2026-12-31'`
  - `test('update 결과가 저장되고 다시 읽힌다')` → `update(d => { d.ui.tab = 'expense' })` 후 새 `createStore(같은 storage).get().ui.tab === 'expense'`
  - `test('구독자에게 알리고 해제할 수 있다')` → 호출 1회, 해제 후 0회
  - `test('깨진 JSON은 보존하고 기본값으로 시작')` → storage에 `'{oops'` 넣고 생성 → `get()`은 기본 상태, `fukuoka-trip:corrupt:`로 시작하는 키에 `'{oops'` 보존, 원래 키는 아직 덮어쓰지 않음(첫 `update` 전까지)
  - `test('storage가 null이어도 동작')` → `createStore(null)`로 `update`/`get` 정상, `lastError === 'storage-unavailable'`
  - `test('setItem이 예외를 던지면 lastError 기록')` → 메모리 상태는 갱신, `lastError === 'save-failed'`
  - `test('newId는 접두사와 고유값')` → `newId('p')`가 `/^p_/`, 100개 생성 시 중복 없음
- [ ] **Step 2:** `npm test` → 위 테스트들이 "Cannot find module" 류로 FAIL
- [ ] **Step 3:** `js/store.js` 구현 (위 Interfaces 그대로, 깊은 복사는 `structuredClone`)
- [ ] **Step 4:** `npm test` → 전부 PASS
- [ ] **Step 5:** `git init`(최초 1회) 후 커밋 `feat: 상태 저장소`

### Task 2: 앱 화면 뼈대 (하단 메뉴 4탭)

**Files:**
- Create: `index.html`, `css/app.css`, `js/app.js`, `js/tabs/map.js`, `js/tabs/checklist.js`, `js/tabs/transit.js`, `js/tabs/expense.js`

**Interfaces:**
- Consumes: Task 1 `createStore`, `State.ui.tab`
- Produces:
  - 탭 ID: `'map' | 'checklist' | 'transit' | 'expense'`
  - 각 탭 모듈: `export function mount(el: HTMLElement, store): void` — 1단계에서는 제목과 "준비 중" 문구만 렌더.
  - DOM: `<main id="view">`, `<nav id="tabbar">` 안의 `<button data-tab="...">`, 경고 배너 `<div id="banner" hidden>`

- [ ] **Step 1:** `index.html` — `lang="ko"`, viewport `width=device-width, initial-scale=1, viewport-fit=cover`, `theme-color`, 상대경로로 `css/app.css`, `js/app.js`(type=module), manifest 링크(Task 3에서 파일 생성).
- [ ] **Step 2:** `css/app.css` — 색상은 `:root` 변수, 본문 17px, 하단 메뉴 고정·높이 64px·`env(safe-area-inset-bottom)` 여백, 선택 탭 강조, `#view`는 남은 높이 전체.
- [ ] **Step 3:** `js/app.js` — 스토어 생성(`localStorage` 접근을 try/catch, 실패 시 `null`), 마지막 탭(`ui.tab`) 복원, 탭 버튼 클릭 시 `update`로 탭 저장 후 해당 모듈 `mount`, `lastError`가 있으면 배너 "이 기기에 저장되지 않습니다. 백업을 자주 해주세요." 표시, `navigator.storage?.persist?.()` 호출.
- [ ] **Step 4: 확인** — `python3 -m http.server 8080`(프로젝트 루트)로 띄우고 Chrome DevTools로 390×844 에뮬레이션:
  - 4개 탭 전환, 선택 표시가 바뀜
  - 새로고침 후 마지막 탭 유지
  - 콘솔 에러 0
  - 스크린샷 저장 `docs/screens/stage1-tabs.png`
- [ ] **Step 5:** 커밋 `feat: 하단 메뉴 4탭 뼈대`

### Task 3: PWA 설치 (아이콘·manifest·서비스 워커)

**Files:**
- Create: `manifest.webmanifest`, `sw.js`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/maskable-512.png`, `tools/make_icons.py`
- Modify: `js/app.js`(서비스 워커 등록)

**Interfaces:**
- Produces: `CACHE_VERSION = 'v1'`(sw.js 상단, 배포 때마다 올림), 캐시 이름 `'fukuoka-trip-' + CACHE_VERSION`

- [ ] **Step 1:** `tools/make_icons.py` — Pillow로 단색 배경 + 흰색 "福" 또는 지도핀 도형 아이콘 3종 생성(maskable은 중앙 80% 안에 그림). 실행 후 3개 파일 존재 확인.
- [ ] **Step 2:** `manifest.webmanifest` — `name: "후쿠오카 여행"`, `short_name: "후쿠오카"`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, `orientation: "portrait"`, `lang: "ko"`, 아이콘 3종(maskable은 `purpose: "maskable"`).
- [ ] **Step 3:** `sw.js` — install 시 앱 파일 목록(`./`, `./index.html`, css, js 전부, manifest, 아이콘) 미리 캐시 + `skipWaiting()`; activate 시 다른 버전 캐시 삭제 + `clients.claim()`; fetch: 내비게이션 요청은 네트워크 우선·실패 시 캐시된 `./index.html`, 같은 출처 정적 파일은 캐시 우선, 다른 출처(이후 지도 타일)는 손대지 않음.
- [ ] **Step 4:** `app.js`에서 `navigator.serviceWorker.register('./sw.js')`.
- [ ] **Step 5: 확인** (로컬 서버, DevTools)
  - Application 패널: manifest 오류 없음, 아이콘 3종 로드, 서비스 워커 activated
  - Network를 Offline으로 바꾸고 새로고침 → 화면이 그대로 열림
  - Lighthouse PWA/설치 가능성 항목에 실패 없음(가능한 범위)
- [ ] **Step 6:** 커밋 `feat: PWA 설치 지원`

### Task 4: GitHub Pages 배포 + 폰 설치

**Files:**
- Create: `README.md`(배포·업데이트 방법), `.nojekyll`, `.gitignore`(`.DS_Store`, `docs/screens/` 제외 여부는 빌더 판단)

- [ ] **Step 1:** `README.md`에 사용자용 절차를 한국어로 작성:
  1. GitHub에서 새 저장소 만들기(이름 예: `fukuoka-trip`, Public — 무료 Pages 조건)
  2. `git remote add origin ...` → `git push -u origin main`
  3. Settings → Pages → Branch `main` / `/ (root)` 저장
  4. 1~2분 뒤 `https://<계정>.github.io/fukuoka-trip/` 접속
  5. 안드로이드 크롬 ⋮ → "앱 설치"(또는 "홈 화면에 추가")
  6. 업데이트 방법: 수정 → `sw.js`의 `CACHE_VERSION` 올림 → 커밋·push → 앱을 완전히 닫았다 다시 열기
- [ ] **Step 2:** 커밋 `docs: 배포 안내`
- [ ] **Step 3: 사용자 작업** — 사용자가 저장소 생성·push·Pages 설정 (Claude는 명령어 안내만, 계정 조작 안 함)
- [ ] **Step 4: 확인** — Claude가 배포 URL을 브라우저로 열어 콘솔·404 없음 확인 → 사용자가 폰에서 설치, 아이콘·전체화면·탭 전환·비행기 모드에서 열림 확인
- [ ] **Step 5:** 1단계 완료 보고, 2단계 계획 작성으로 이동
