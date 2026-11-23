// 3일차. 쓰는 법은 js/schedule/index.js 맨 위 설명 참고.
export default {
  date: '2027-01-02',
  label: '1/2(토)',
  title: '',
  stay: 'ryokan',
  stops: [
    {
      name: '라이블리 하카타점',
      desc: '체크아웃',
      move: {
        distance: '약 1.5km',
        total: '10~20분',
        choose: true,
        steps: [
          { mode: 'subway', title: '지하철', text: '나카스카와바타역에서 하카타역까지 2정거장', time: '10~15분', note: '역까지 도보 포함' },
          { mode: 'bus', title: '버스', text: '하카타 버스터미널 방면 버스', time: '10~15분', note: '정류장까지 도보 포함' },
          { mode: 'walk', title: '도보 이동', text: '숙소에서 하카타 버스터미널까지 약 1.5km', time: '18~20분' },
        ],
      },
    },
    {
      name: '하카타 버스터미널',
    },
  ],
};
