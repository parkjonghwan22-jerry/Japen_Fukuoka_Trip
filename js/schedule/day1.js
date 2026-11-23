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
      move: {
        total: '약 30~40분',
        steps: [
          { mode: 'shuttle', from: '국제선 터미널', to: '국내선 터미널', time: '10~15분', note: '무료 셔틀버스 · 배차 10~15분' },
          { mode: 'walk', from: '국내선 터미널', to: '후쿠오카 공항역', time: '5~10분', note: '지하로 내려가면 지하철역' },
          { mode: 'subway', from: '후쿠오카 공항역', to: '나카스카와바타역', time: '8~10분' },
          { mode: 'walk', from: '나카스카와바타역', to: '라이블리 하카타점', time: '5분 안팎' },
        ],
      },
    },
    {
      time: '20:30',
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
