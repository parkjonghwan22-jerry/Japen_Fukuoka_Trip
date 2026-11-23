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
          { mode: 'shuttle', text: '국제선 터미널에서 무료 셔틀버스를 타고 국내선 터미널로', time: '10~15분', note: '배차 10~15분' },
          { mode: 'walk', text: '지하로 내려가 후쿠오카 공항역까지 걸어서', time: '5~10분' },
          { mode: 'subway', text: '지하철을 타고 나카스카와바타역까지', time: '8~10분' },
          { mode: 'walk', text: '역에서 숙소까지 걸어서', time: '5분 안팎' },
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
