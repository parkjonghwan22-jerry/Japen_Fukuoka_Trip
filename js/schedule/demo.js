// 화면 확인용 예시 데이터. 주소 뒤에 ?demo 를 붙였을 때만 보인다. 내용은 실제 정보가 아니다.

export const DEMO_STAYS = {
  hotelA: { name: '예시 호텔 하카타' },
  ryokan: { name: '예시 료칸 유후인' },
  hotelB: { name: '예시 호텔 텐진' },
};

const cand = (name, fromStay, extra = {}) => ({
  name, fromStay, area: '예시 지역', desc: '예시 설명입니다. 실제 정보가 아닙니다.', ...extra,
});

export const DEMO_DAYS = [
  {
    date: '2026-12-31', label: '12/31(목)', title: '도착 · 나카스 야타이', stay: 'hotelA',
    stops: [
      { time: '17:30', name: '후쿠오카 공항 도착', area: '국제선 터미널', desc: '입국 심사 후 지하철로 이동', fromStay: '지하철 10분', reservation: 'none',
        then: [cand('공항 편의점', '공항 안')] },
      { time: '19:00', name: '숙소 체크인', area: '하카타역 근처', fromStay: '-', reservation: 'done', reservationNote: '예약번호 0000',
        then: [
          cand('캐널시티 하카타', '도보 15분 · 1.1km'),
          cand('쿠시다 신사', '도보 12분 · 900m', { reservation: 'none' }),
          cand('하카타 리버레인', '도보 18분 · 1.4km'),
          cand('라멘 가게 (예시)', '도보 8분 · 600m', { reservation: 'need', reservationNote: '줄 서는 곳' }),
          cand('돈키호테 나카스', '도보 14분 · 1km'),
          cand('스미요시 신사', '도보 10분 · 800m'),
        ] },
      { time: '21:00', name: '나카스 야타이 거리', area: '나카스 강변', desc: '연말이라 영업 여부 확인 필요\n현금 준비', fromStay: '도보 15분 · 1.2km', reservation: 'none' },
    ],
  },
  {
    date: '2027-01-01', label: '1/1(금)', title: '다자이후 하츠모데', stay: 'hotelA',
    stops: [
      { time: '09:00', name: '다자이후 텐만구', area: '다자이후시', desc: '새해 참배 인파가 많으므로 아침 일찍 출발', fromStay: '전철 40분', reservation: 'none',
        then: [cand('참배길 떡집 (예시)', '전철 40분'), cand('규슈 국립박물관', '전철 45분')] },
      { time: '14:00', name: '텐진 지하상가', area: '텐진', fromStay: '지하철 5분', reservation: 'none' },
    ],
  },
  { date: '2027-01-02', label: '1/2(토)', title: '유후인 료칸', stay: 'ryokan',
    stops: [{ time: '15:00', name: '료칸 체크인', area: '유후인', fromStay: '-', reservation: 'done', reservationNote: '석식 18시' }] },
  { date: '2027-01-03', label: '1/3(일)', title: '', stay: 'hotelB', stops: [] },
  { date: '2027-01-04', label: '1/4(월)', title: '귀국', stay: null,
    stops: [{ time: '11:00', name: '후쿠오카 공항 출국', fromStay: '지하철 15분' }] },
];
