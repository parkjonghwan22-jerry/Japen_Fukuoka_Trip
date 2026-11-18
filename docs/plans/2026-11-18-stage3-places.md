# 3단계: 장소 추가·수정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 지도에서 장소를 추가(길게 누르기 / 현재 위치 / 검색)하고, 마커를 누르면 장소 카드가 열려 정보 확인·구글맵 길찾기·수정·삭제를 할 수 있다.

**Architecture:** 장소 데이터 규칙은 `js/places.js`(순수 함수, 테스트 대상)가 소유한다. 화면은 공용 하단 시트 `js/ui/sheet.js` 위에 장소 카드·입력 폼(`js/ui/place-card.js`, `js/ui/place-form.js`)을 올린다. 검색은 OpenStreetMap Nominatim(무료·키 없음), 결과 해석은 `js/geocode.js`의 순수 함수로 분리.

**Spec:** `docs/design.md` 5.1(장소 카드·추가), 5.4(순서 규칙·숙소)

## Global Constraints
- Place 형태는 2단계 계획의 형태를 그대로 쓴다. `lat`/`lng`/`order`는 **저장 시 숫자로 변환**한다(2단계 검토 이월 사항).
- 종류(kind): `일정(plan)` / `후보(candidate)` / `숙소(stay)`. 일정은 일차 필수.
- 카테고리: `맛집` `카페` `쇼핑` `관광` `기타`.
- 연말연시 영업: `영업` / `휴무` / `미확인`(기본).
- 머무는 시간 선택지: 없음, 30분, 1시간, 1시간 30분, 2시간, 3시간 → `stayMinutes`(숫자 또는 null).
- 일정의 새 장소·다른 일차로 옮긴 장소는 그 일차 **맨 뒤** 순서. 삭제·이동 후 남은 일차 순서는 1,2,3…으로 다시 매긴다.
- 길찾기: `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&travelmode=transit` (대중교통 기본).
- 검색: Nominatim, 후쿠오카 주변 우선(viewbox), 언어 `ko,ja,en`, 1초에 1회 이하, 입력 멈춘 뒤 0.6초에 요청.
- 모든 사용자 입력은 화면에 넣을 때 이스케이프.
- 아이콘 없이 글자 중심(사용자 선호). 후보 마커는 지금처럼 회색 점, 카테고리는 카드에 글자로.

## Review Focus
1. 이름 빈칸, 좌표 없음, 일정인데 일차 없음 → 저장 막고 이유를 폼에 표시.
2. 장소 수정으로 일정→후보, 일차 변경 → 이전 일차 순서 빈틈 없이 재정렬, 새 일차 맨 뒤.
3. 검색 결과 0건 / 네트워크 실패 → "결과 없음" / "인터넷 연결을 확인해주세요" 안내, 앱 멈춤 없음.
4. 위치 권한 거부·위치 실패 → 안내 문구, 폼은 열리지 않음.
5. 장소 이름·메모에 `<script>` 같은 문자 → 그대로 글자로 보임.

### Task 1: 장소 규칙 `js/places.js`
**Produces:**
- `KINDS`, `CATEGORIES`, `NEW_YEAR`, `STAY_OPTIONS`
- `validatePlace(input): { ok: true, place } | { ok: false, errors: Record<field, string> }` — 문자열 좌표·order를 숫자로, 빈 문자열은 null, 이름 앞뒤 공백 제거
- `savePlace(places, place): Place[]` — 새 장소면 id 부여·추가, 기존이면 교체. 일차 바뀌면 순서 처리.
- `deletePlace(places, id): Place[]` — 삭제 후 해당 일차 재정렬
- `directionsUrl(place): string`
테스트 먼저(`tests/places.test.mjs`).

### Task 2: 검색 해석 `js/geocode.js`
- `parseNominatim(json): { name, address, lat, lng }[]` (테스트 먼저, 숫자 변환·빈 배열·잘못된 값 처리)
- `searchPlaces(query, { signal }): Promise<...>` — fetch 래퍼(브라우저에서 확인)

### Task 3: 하단 시트 · 장소 카드 · 입력 폼
- `js/ui/sheet.js`: `openSheet(contentEl, { title }) → { close }` — 배경 눌러 닫기, 뒤로가기 버튼으로 닫기(history), 한 번에 하나.
- `js/ui/place-card.js`: 카드(이름, 종류·일차·시간·머무는 시간, 카테고리, 메모, 영업시간, 연말연시) + `길찾기` `수정` `삭제`(삭제는 시트 안에서 한 번 더 확인 — 브라우저 confirm 대화상자 사용 안 함).
- `js/ui/place-form.js`: 입력 폼(종류에 따라 일차/묵는 날 표시 전환), 저장 시 `validatePlace` 오류를 각 칸 아래 표시.

### Task 4: 지도 연결
- 마커 누르면 말풍선 대신 장소 카드(예시 장소는 기존 말풍선 유지).
- 지도 길게 누르기(`contextmenu`) → 그 좌표로 새 장소 폼.
- 우하단 `＋` 버튼 → 선택: `현재 위치로 추가` / `이름으로 검색` / 안내 "지도를 길게 눌러도 추가할 수 있어요".
- 저장·삭제 후 지도 다시 그림. 새 장소를 넣으면 예시는 자동으로 사라짐.
- `sw.js` APP_FILES·버전. 390×844에서 각 흐름 확인·스크린샷.
