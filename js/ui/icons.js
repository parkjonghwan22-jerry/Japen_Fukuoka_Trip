// 노선 위 작은 원 안에 들어가는 선 아이콘 (24×24, 색은 글자색을 따른다)
const svg = (body) => `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  // 이동
  car: svg('<path d="M3.5 13.5 5.6 7.6A2 2 0 0 1 7.5 6.3h9a2 2 0 0 1 1.9 1.3l2.1 5.9v4H3.5z"/><path d="M3.5 13.5h17"/><path d="M6 17.5v2M18 17.5v2"/><path d="M7 15.5h.01M17 15.5h.01"/>'),
  // 후보 구간
  food: svg('<path d="M4 3v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V3"/><path d="M7 3v18"/><path d="M20 15V3a4.5 4.5 0 0 0-4.5 4.5V13a2 2 0 0 0 2 2H20zm0 0v6"/>'),
  cafe: svg('<path d="M4 9h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M16 10h1.5a3 3 0 0 1 0 6H16"/><path d="M7 3v2.5M10.5 3v2.5"/>'),
  shop: svg('<path d="M5.5 7h13l-1 13h-11z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>'),
  sight: svg('<path d="M4 8h3l1.6-2.5h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.2"/>'),
};

// 후보 구간 아이콘별 접힌 줄 이름
export const THEN_LABELS = { food: '먹을 곳', cafe: '카페', shop: '쇼핑', sight: '볼거리' };
