# 1.5단계: 홈 탭 + 앱 아이콘 교체 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 홈 탭(메인 포토카드 + 썸네일 줄 + `＋` 칸)을 추가하고 앱 아이콘을 "Fuku♥ka"로 바꾼다.

**Architecture:** 1단계 구조 그대로. `home` 탭 모듈 추가, 사진 목록은 `js/photos.js` 상수. 사진은 도구 스크립트로 회전 보정·축소·메타데이터 제거 후 `photos/`에 둔다.

**Spec:** `docs/design.md` 5.7절

## Global Constraints
- 하단 메뉴 순서: `홈 / 지도 / 준비물 / 교통 / 지출`. 앱은 항상 홈에서 시작.
- 홈 상단: `후쿠오카` / `2026.12.31(목) – 2027.1.3(일)`. D-day 없음.
- 아이콘: 크림(#faf5ee) 바탕, 남색(#1f3a5f) "Fuku" + 빨간(#d65c54) 하트 + "ka", Avenir Next Demi Bold.
- 사진 원본 `../사진.jpeg`은 저장소에 넣지 않는다. EXIF(위치 포함) 제거본만 넣는다.
- 모든 경로 상대경로, 새 js 파일은 `sw.js` APP_FILES에 추가(테스트가 검사).

## Review Focus
1. 세로로 찍힌 사진이 옆으로 누워 보임 → 회전 보정 후 저장(EXIF 제거하면 브라우저가 보정 못 함).
2. 사진에 위치정보가 남아 공개됨 → 결과 파일 EXIF 없음 확인.
3. 마스커블 아이콘이 원형으로 잘릴 때 글자가 잘림 → 글자 폭을 안전 영역(중앙 80%) 안에.
4. 사진 로딩 전 레이아웃이 튐 → 포토카드 비율 고정(3:4).
5. 저장된 `ui.tab`이 무엇이든 시작 화면은 홈.

### Task 1: 아이콘·사진 준비
- Modify: `tools/make_icons.py` → 후보 C 그리기(마스커블은 0.72배 축소). 재생성 후 눈으로 확인.
- Create: `tools/prepare_photo.py <원본> ` → `photos/main.jpg`(긴 변 1440px, 품질 82, EXIF 제거, 회전 보정), `photos/main-thumb.jpg`(긴 변 240px).
- 확인: 두 파일 EXIF 없음, 세로 방향.

### Task 2: 홈 탭
- Modify `js/router.js`: `TABS = ['home','map','checklist','transit','expense']`, `resolveTab` 기본값 `'home'`. 테스트 먼저 수정(RED→GREEN).
- Modify `js/store.js`: `defaultState().ui.tab = 'home'`. 테스트 먼저.
- Create `js/photos.js`: `export const BUNDLED_PHOTOS = [{ id: 'bundled-1', src: './photos/main.jpg', thumb: './photos/main-thumb.jpg', alt: '우리 사진' }]`
- Create `js/tabs/home.js`: `mount(el, store)` — 제목·일정, 포토카드(`aspect-ratio: 3/4`, 흰 테두리, 둥근 모서리, 그림자), 썸네일 줄(가로 스크롤, 선택 표시), 끝의 `＋` 버튼(누르면 "사진 추가 기능은 곧 추가됩니다" 토스트).
- Modify `index.html`(홈 버튼 추가), `css/app.css`(5칸, 홈 스타일), `js/app.js`(시작 시 항상 `home`).
- Modify `sw.js`: APP_FILES에 새 파일·사진 추가, `CACHE_VERSION = 'v3'`.
- 확인: `npm test` 통과, 390×844에서 홈 스크린샷, 썸네일 선택 표시, `＋` 토스트, 다른 탭 갔다 새로고침해도 홈에서 시작.
