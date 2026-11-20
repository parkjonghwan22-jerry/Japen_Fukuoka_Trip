// 일정 데이터 모음. 일차 파일(day1.js ~ day5.js)을 고치고 push하면 두 사람 폰 모두 같은 일정이 보인다.
//
// 일차 파일 쓰는 법
//   title: '도착 · 나카스'        이 날의 한 줄 요약 (일차 카드와 상세 제목에 표시)
//   stay:  'hotelA'               이 날 묵는 숙소 (stays.js의 키, 귀국일은 null)
//   stops: [ 핵심 일정, ... ]      위에서 아래로 노선 순서
//
// 핵심 일정 (name만 필수, 나머지는 생략 가능)
//   {
//     time: '10:00',
//     name: '다자이후 텐만구',
//     area: '다자이후시',                 위치
//     desc: '오전 일찍 가기',              설명 (줄바꿈은 \n)
//     reservation: 'done',               'done' 예약 완료 | 'need' 예약 필요 | 'none' 예약 없음 (생략하면 예약 줄을 숨김)
//     reservationNote: '예약번호 1234',   예약 관련 메모
//     fromStay: '지하철 40분 · 14km',     숙소로부터 거리 (적은 그대로 표시)
//     then: [ 후보, ... ],                이 일정과 다음 일정 사이에 갈 만한 곳
//   }
//
// 후보: 핵심 일정과 같은 항목에서 time, then만 뺀 것

import day1 from './day1.js';
import day2 from './day2.js';
import day3 from './day3.js';
import day4 from './day4.js';
import day5 from './day5.js';

export { STAYS } from './stays.js';
export const DAYS = [day1, day2, day3, day4, day5];

export const RESERVATION = { done: '예약 완료', need: '예약 필요', none: '예약 없음' };
