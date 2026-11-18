# 4단계: 일정 목록 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 지도 아래에서 끌어올리는 일정 패널로 선택한 일차의 일정을 순서대로 보고, 항목을 누르면 지도가 그 장소로 이동해 카드가 열리며, 순서를 바꾸고 후보를 일정에 넣을 수 있다.

**Architecture:** 목록 구성·순서 이동·일정 편입은 `js/itinerary.js` 순수 함수(테스트 대상). 패널 화면은 `js/ui/day-panel.js`, 지도 탭(`js/tabs/map.js`)이 패널과 지도를 연결한다.

**Spec:** `docs/design.md` 5.1 하단 시트, 5.4 순서 규칙

## Global Constraints
- 순서 기준은 수동 `order`(시간 아님). 시간은 표시만, 앞 항목보다 이른 시간이면 "시간 확인" 표시.
- 순서 바꾸기는 **위/아래 버튼**(지도 위 드래그와 충돌 없음, 한 손 조작 확실). `순서 바꾸기` 버튼을 눌렀을 때만 보인다.
- 패널 두 상태: **접힘**(제목 줄만, 약 76px) / **펼침**(화면 약 60%). 제목 줄을 누르거나 위·아래로 쓸어 전환.
- 필터별 내용:
  - `d1..d4`: 그 일차 일정(번호·이름·시간·머무는 시간·분류) + 그 날 숙소
  - `all`: 일차별 묶음(제목에 일차·장소 수), 순서 바꾸기 없음
  - `candidates`: 후보(+일차 없는 일정) 목록, 항목마다 `일정에 넣기` → 일차 고르면 그 일차 맨 뒤
- 항목을 누르면: 지도를 그 장소로 이동(줌 16) + 장소 카드 열기.
- 빈 목록 안내: 일차 "아직 일정이 없어요. 지도를 길게 눌러 추가해보세요", 후보 "후보가 없어요".
- 예시 장소일 때도 목록은 보이되 순서 바꾸기·일정에 넣기는 숨긴다.
- 패널이 있으므로 `＋` 버튼과 지도 맞춤 여백을 패널 높이만큼 올린다.

## Review Focus
1. 첫 항목 위로 / 마지막 항목 아래로 → 아무 변화 없음.
2. 순서가 1,3처럼 빈틈 있거나 같은 데이터 → 이동 후 1,2,3… 연속.
3. 후보를 일정에 넣으면 kind=plan, 해당 일차, order=그 일차 최대+1; 일차 없는 일정도 같은 방식.
4. 시간 없는 항목은 비교에서 빠지고 경고 없음.
5. 패널 펼친 상태에서 탭 이동·복귀 → 지도·패널 정상.

### Task 1: `js/itinerary.js`
- `daySections(places, days, filter): { dayId, label, color, items: Place[], stays: Place[] }[]` (`all`은 4개, 일차는 1개, `candidates`는 빈 배열)
- `candidateItems(places): Place[]` — 후보 + 일차 없는 일정, 이름순
- `moveInDay(places, id, dir: -1|1): Place[]`
- `addToDay(places, id, dayId): Place[]` (`savePlace` 재사용)
- `timeWarnings(items): Set<id>` — 시간 있는 항목끼리 앞보다 이르면 표시
테스트 먼저 `tests/itinerary.test.mjs`.

### Task 2: 패널 화면과 지도 연결
- `js/ui/day-panel.js`: `createDayPanel(container, { onSelect(place), onMove(id, dir), onAddToDay(id, dayId) }) → { update(state, filter, isSample), expand(), collapse() }`
- `map.js`: 패널 생성·갱신, 항목 선택 시 `map.flyTo` + 카드, 이동·편입 후 저장·다시 그림.
- CSS, `sw.js` 목록·버전. 390×844에서 접힘/펼침, 순서 이동, 후보 편입, 탭 왕복 확인·스크린샷.
