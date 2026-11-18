# 후쿠오카 여행 앱

2026-12-31(목) ~ 2027-01-03(일) 후쿠오카 3박 4일 여행용 일회성 웹앱(PWA).
설계: `docs/design.md` · 단계별 계획: `docs/plans/`

## 처음 올리기 (1회)

1. GitHub에서 **New repository** → 이름 `fukuoka-trip` → **Public** 선택 → README 등은 추가하지 않고 **Create repository**
   (무료 계정의 GitHub Pages는 Public 저장소에서만 동작합니다. 실제 일정 데이터는 저장소에 올라가지 않습니다.)
2. 터미널에서:
   ```bash
   cd ~/Desktop/jonghwan/fukuoka-trip
   git remote add origin https://github.com/<내계정>/fukuoka-trip.git
   git push -u origin main
   ```
3. 저장소 페이지 → **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main` / `/ (root)` → **Save**
4. 1~2분 뒤 `https://<내계정>.github.io/fukuoka-trip/` 접속

## 폰에 설치 (안드로이드 크롬)

1. 위 주소를 크롬으로 연다.
2. 오른쪽 위 **⋮ → 앱 설치** (또는 **홈 화면에 추가**)
3. 홈 화면의 빨간 핀 아이콘으로 실행한다.

## 업데이트할 때

1. 파일 수정
2. `sw.js` 맨 위 `CACHE_VERSION`을 올린다 (`'v1'` → `'v2'`)
3. `git commit` → `git push`
4. 1~2분 뒤 폰에서 앱을 **완전히 닫았다가** 다시 연다 (안 바뀌면 한 번 더)

## 개발

- 테스트: `npm test`
- 로컬 실행: `python3 -m http.server 8080` → http://localhost:8080
- 아이콘 다시 만들기: `python3 tools/make_icons.py`
