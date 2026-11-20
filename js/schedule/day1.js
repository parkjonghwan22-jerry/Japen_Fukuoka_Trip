// 1일차. 쓰는 법은 js/schedule/index.js 맨 위 설명 참고.
export default {
  date: '2026-12-31',
  label: '12/31(목)',
  title: '후쿠오카 도착',
  stay: 'hotelA',
  stops: [
    {
      time: '18:50',
      name: '후쿠오카 공항',
      desc: '도착',
      fromStay: '대중교통 22분 · 5.3km',
    },
    {
      name: '라이블리 하카타점',
      desc: '체크인',
    },
    // 숙소 근처에서 먹고 놀다가 다시 숙소로 — 두 점 사이에 후보를 넣는다
    {
      name: '라이블리 하카타점',
      desc: '숙소 복귀',
    },
  ],
};
