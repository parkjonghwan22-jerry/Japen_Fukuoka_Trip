// 일정 데이터 모음. 일차 파일(day1.js ~ day5.js)을 고치고 push하면 두 사람 폰 모두 같은 일정이 보인다.
//
// 일차 파일 쓰는 법
//   title: '도착 · 나카스'        이 날의 한 줄 요약 (일차 카드와 상세 제목에 표시)
//   stay:  'hotelA'               이 날 묵는 숙소 (stays.js의 키, 귀국일은 null)
//   stops: [ 핵심 일정, ... ]      위에서 아래로 노선 순서
//
// 핵심 일정 (name만 필수, 나머지는 생략 가능)
//   {
//     time: '10:00',                     또는 '21:00~22:00'
//     name: '다자이후 텐만구',
//     area: '다자이후시',                 위치
//     desc: '오전 일찍 가기',              설명 (줄바꿈은 \n)
//     fromStay: '1.5km',                 숙소에서 거리
//     access: '대중교통 10~15분 · 도보 20분', 가는 법
//     hours: '23시까지',                  영업시간
//     price: '디너 2,000~3,000엔',         가격
//     menu: '돈코츠 라멘, 교자',            먹거리
//     tips: '현금 준비\n화장실 미리',     참고 (줄바꿈은 \n)
//     reservation: 'done',               done 예약 완료 | ok 예약 가능 | need 예약 필요 | no 예약 불가 | none 예약 없음
//                                         (생략하면 예약 줄을 숨김)
//     ※ 위치·거리·영업·가격·예약이 있으면 카드를 눌러 펼쳐 본다
//     reservationNote: '예약번호 1234',   예약 관련 메모
//     move: { distance: '5.3km', total: '약 30분', steps: [ 이동 단계, ... ] },
//                                          다음 일정까지 가는 방법 (거리·총 시간은 접힌 줄에 표시)
//     then: [ 후보, ... ],                이 일정과 다음 일정 사이에 갈 만한 곳
//     thenIcon: 'food',                  후보 구간 아이콘: food 먹을 곳 | cafe 카페 | shop 쇼핑 | sight 볼거리
//                                         (정하면 후보가 0곳이어도 구간이 보인다)
//   }
//
// 이동 단계
//   { mode: 'subway', title: '지하철', text: '나카스카와바타역까지', time: '8~10분', note: '...' }
//   mode: procedure 수속 | walk 도보 이동 | bus 버스 | shuttle 셔틀버스 | subway 지하철 | train 전철 | taxi 택시
//   title을 생략하면 mode 이름이 제목이 된다
//   move에 choose: true 를 넣으면 단계들이 순서가 아니라 '또는'으로 고르는 방법이 된다

import day1 from './day1.js';
import day2 from './day2.js';
import day3 from './day3.js';
import day4 from './day4.js';
import day5 from './day5.js';

export { STAYS } from './stays.js';
export const DAYS = [day1, day2, day3, day4, day5];

export const RESERVATION = {
  done: '예약 완료', ok: '예약 가능', need: '예약 필요', no: '예약 불가', none: '예약 없음',
};
